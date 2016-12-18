package tetris

import (
	"encoding/json"
	"io"
	"log"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"github.com/rs/xid"
)

type playerInfo struct {
	token string
	conn  *websocket.Conn
}

type player struct {
	playerInfo
	data *GameData

	lastUpdate int64
}

type Game struct {
	mgr     *GamesMgr
	id      xid.ID
	players []*player

	mutex sync.Mutex
}

type GamesMgr struct {
	Games map[string]*Game
}

/*--------------------------------------------------------- GamesMgr Method ---------------------------------------------------------*/

func NewGameMgr() GamesMgr {
	return GamesMgr{Games: make(map[string]*Game)}
}

// Search  function return a game if exist
func (mgr *GamesMgr) Search(id string) *Game {
	game, ok := mgr.Games[id]
	if ok {
		return game
	}

	return nil
}

// Gain  function return a game if exist otherwise create a new game
func (mgr *GamesMgr) Gain(id string) *Game {
	game := mgr.Search(id)
	if game != nil {
		return game
	}

	newGame := new(Game)
	newGame.init(mgr, id)
	mgr.Games[id] = newGame
	return newGame
}

// Delete function remove the corresponding game
func (mgr *GamesMgr) Delete(id string) bool {
	delete(mgr.Games, id)
	return true
}

/*--------------------------------------------------------- End GamesMgr ------------------------------------------------------------*/

/*--------------------------------------------------------- Game Method ---------------------------------------------------------*/
func (game *Game) init(mgr *GamesMgr, id string) {
	game.mgr = mgr
	var err error
	game.id, err = xid.FromString(id)
	if err == nil {
		mgr.Games[id] = game
	}
}

// Handle function deal with udp data to json object and dispatch to message's self handle
func (game *Game) Handle(data []byte, sender *player) {
	var ms ClientMessage
	err := json.Unmarshal(data, &ms)
	if err != nil {
		log.Println("json decode err:", err)
	}

	game.mutex.Lock()
	defer game.mutex.Unlock()
	switch ms.Command {
	case Update:
		game.handleUpdate(ms, sender)

	case Leave:
		game.handleLeave(ms, sender)

	case Start:
		//game.handleStart(ms)

	default:

	}
}

func (game *Game) getPlayer(token string) (*player, int) {
	for i := 0; i < len(game.players); i++ {
		player := game.players[i]
		if player != nil && player.token == token {
			return player, i
		}
	}

	return nil, -1
}

func (game *Game) handleUpdate(ms ClientMessage, sender *player) {
	if sender == nil {
		log.Println("err empty player")
		return
	}

	// just replace
	sender.data = &ms.GameData

	opponent, nOther := game.getOpponent(sender)
	if opponent == nil {
		return
	}

	sm := ServerMessage{Command: Update, Other: *sender.data}
	game.notify(nOther, sm)
}

func (game *Game) getOpponent(p *player) (*player, int) {
	if p == nil {
		return nil, -1
	}

	for i := 0; i < len(game.players); i++ {
		if p != game.players[i] {
			if game.players[i] != nil {
				return game.players[i], i
			}
			break
		}
	}
	return nil, -1
}

func (game *Game) notify(idx int, data ServerMessage) {
	if idx > len(game.players) {
		log.Println("out of range of players")
		return
	}

	player := game.players[idx]
	if player == nil {
		log.Println("try to send to empty player")
		return
	}

	//response(player.addr, data)
}

func (game *Game) playerLeave(p *player) {
	if p == nil || p.conn == nil {
		return
	}

	p.conn.Close()
	p.conn = nil

	opponent, _ := game.getOpponent(p)
	if opponent == nil || (opponent.data != nil && opponent.data.Status == End) {
		game.Destroy()
	}

	if p.data != nil && p.data.Status >= Run {
		p.data.Status = End
	} else {

	}
}

func (game *Game) handleLeave(ms ClientMessage, sender *player) {
	game.playerLeave(sender)
}

func newPlayer(token string, conn *websocket.Conn) *player {
	return &player{
		playerInfo: playerInfo{
			token: token,
			conn:  conn},
		lastUpdate: time.Now().UnixNano()}
}

func (game *Game) listen(p *player) {
	conn := p.conn
	defer conn.Close()
	for p.conn == conn {
		messageType, message, err := conn.ReadMessage()
		if websocket.BinaryMessage != messageType {
			log.Println("error message Type")
		}
		if err == io.EOF {
			game.playerLeave(p)
			break
		} else {
			game.Handle(message, p)
		}
	}
}

func (game *Game) Destroy() {
	game.mgr.Delete(game.id.String())
	for i := 0; i < len(game.players); i++ {
		if game.players[i] != nil && game.players[i].data != nil {
			game.players[i].conn.Close()
			game.players[i].conn = nil
		}
	}
}

func (game *Game) TryJoin(token string, conn *websocket.Conn) bool {
	game.mutex.Lock()
	defer game.mutex.Unlock()

	player, _ := game.getPlayer(token)
	if player != nil {
		player.conn = conn
	} else {
		for i := 0; i < len(game.players); i++ {
			if game.players[i] == nil {
				game.players[i] = newPlayer(token, conn)
				player = game.players[i]
			}
		}
	}
	if player != nil {
		game.listen(player)
		return true
	}

	return false
}

/*--------------------------------------------------------- End Game ---------------------------------------------------------*/
