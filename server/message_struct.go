package main

// message struct define
// can impove by add a bit set to identify the exact resource later

// game statu
const (
	Waitting int = iota
	Pause
	Start
	Run
	End
	GiveUp
)

// client command
const (
	c_join int = iota
	c_update
	c_leave
	c_start
	c_pause
)

// server command
const (
	s_start int = iota
	s_pause
	s_update
)

// sprite struct
type TetrisSprite struct {
	Type     int    `json:"type"`
	State    int    `json:"state"`
	Position [2]int `json:"pos"`
}

// game data
type GameData struct {
	Score  int          `json:"score"`
	Sprite TetrisSprite `json:"sprite"`
	Grid   []int        `json:"grid"`
	Status int          `json:"status"`
}

// client message struct
type ClientMessage struct {
	Token    string   `json:"token"`
	Code     int      `json:"code"`
	GameData GameData `json:"data"`
}

// server message
type ServerMessage struct {
	Code  int       `json:"code"`
	Self  *GameData `json:"self, omitempty"`
	Other *GameData `json:"other, omitempty"`
}
