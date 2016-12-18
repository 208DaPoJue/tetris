package tetris

// game statu
const (
	Waitting int = iota
	Run
	Pause
	End
)

// command
const (
	Join int = iota
	Update
	Leave
	Start
)

// sprite struct
type TetrisSprite struct {
	Type     int    `json:"type"`
	Status   int    `json:"status"`
	Position [2]int `json:"pos"`
}

// game data
type GameData struct {
	Score  int16        `json:"score"`
	Sprite TetrisSprite `json:"sprite"`
	Grid   []int        `json:"grid"`
	Status int          `json:"staus"`
}

// client message struct
type ClientMessage struct {
	Token    string   `json:"token"`
	Command  int      `json:"cmd"`
	GameData GameData `json:"data"`

	// callback boolean ?
}

// server message
type ServerMessage struct {
	Code    int      `json:"code, omitempty"`
	Command int      `json:"cmd, omitempty"`
	Self    GameData `json:"self, omitempty"`
	Other   GameData `json:"other, omitempty"`
}
