package main

import (
	"encoding/json"
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
	id      string
	players []*player

	status int

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

	_, err := xid.FromString(id)
	if err != nil {
		return nil
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
	game.players = make([]*player, 2)
	game.id = id

	game.status = Waitting

	mgr.Games[id] = game
}

// Handle function deal with udp data to json object and dispatch to message's self handle
func (game *Game) Handle(data []byte, sender *player, idx int) {
	var ms ClientMessage
	err := json.Unmarshal(data, &ms)
	if err != nil {
		log.Println("json decode err:", err)
	}

	game.mutex.Lock()
	defer game.mutex.Unlock()
	switch ms.Code {
	case c_update:
		game.handleUpdate(ms, sender, idx)

	case c_leave:
		game.handleLeave(ms, sender, idx)

	case c_start:
		game.handleStart(ms, sender, idx)

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

func (game *Game) handleUpdate(ms ClientMessage, sender *player, idx int) {
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

	sm := ServerMessage{Code: s_update, Other: sender.data}
	game.notify(nOther, sm)
}

func (game *Game) handleStart(ms ClientMessage, sender *player, idx int) {
	if game.status != Waitting {
		return
	}

	if sender.data == nil {
		sender.data = &GameData{Status: Waitting}
	}
	if sender.data.Status == Waitting {
		sender.data.Status = Start
	}

	p, _ := game.getOpponent(sender)
	if p == nil || p.data == nil || p.data.Status != Start {
		return
	}

	game.status = Run
	for i := 0; i < len(game.players); i++ {
		game.notify(i, ServerMessage{Code: s_start})
	}
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

	game.response(player, data)
}

func (game *Game) playerLeave(p *player, idx int) {
	if p == nil || p.conn == nil {
		return
	}

	p.conn.Close()
	p.conn = nil

	if game.status == Waitting {
		game.players[idx] = nil
	} else if p.data != nil {
		p.data.Status = End
	}

	opponent, _ := game.getOpponent(p)
	if opponent == nil || opponent.conn == nil {
		game.Destroy()
	}
}

func (game *Game) handleLeave(ms ClientMessage, sender *player, idx int) {
	game.playerLeave(sender, idx)
}

func newPlayer(token string, conn *websocket.Conn) *player {
	return &player{
		playerInfo: playerInfo{
			token: token,
			conn:  conn},
		lastUpdate: time.Now().UnixNano()}
}

func (game *Game) listen(p *player, idx int) {
	conn := p.conn
	defer conn.Close()
	for p.conn == conn {
		messageType, message, err := conn.ReadMessage()
		if err != nil {
			log.Println(err)
		}
		if err != nil || websocket.CloseMessage == messageType {
			game.playerLeave(p, idx)
			break
		} else if websocket.TextMessage == messageType {
			game.Handle(message, p, idx)
		} else {
			log.Println("messageType:", messageType)
		}
	}
}

func (game *Game) Destroy() {
	game.mgr.Delete(game.id)
	for i := 0; i < len(game.players); i++ {
		if game.players[i] != nil && game.players[i].data != nil {
			if game.players[i].conn != nil {
				game.players[i].conn.Close()
			}
			game.players[i].conn = nil
		}
	}
}

func (game *Game) TryJoin(token string, conn *websocket.Conn) bool {
	if game.status != Waitting {
		return false
	}

	game.mutex.Lock()

	player, idx := game.getPlayer(token)
	if player != nil {
		player.conn = conn
	} else {
		for idx = 0; idx < len(game.players); idx++ {
			if game.players[idx] == nil {
				game.players[idx] = newPlayer(token, conn)
				player = game.players[idx]
				break
			}
		}
	}
	game.mutex.Unlock()

	if player != nil {
		game.listen(player, idx)
		return true
	}

	return false
}

func (game *Game) response(p *player, ms ServerMessage) {
	if p.conn == nil {
		return
	}
	str, err := json.Marshal(ms)
	if err != nil {
		log.Println(err)
		return
	}
	err = p.conn.WriteMessage(websocket.TextMessage, str)
	if err != nil {
		log.Println(err)
	}
}

/*--------------------------------------------------------- End Game ---------------------------------------------------------*/
