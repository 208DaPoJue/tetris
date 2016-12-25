package main

import (
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"runtime"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/rs/xid"
)

func checkOrigin(r *http.Request) bool {
	return true
}

var upgrader = websocket.Upgrader{CheckOrigin: checkOrigin}

var Count int = 0

func getCurrentDirectory() string {
	dir, err := filepath.Abs(filepath.Dir(os.Args[0]))
	if err != nil {
		log.Fatal(err)
	}
	return dir
}

func main() {
	port := flag.String("p", "8100", "port to serve on")
	directory := flag.String("d", ".", "the directory of static file to host")
	if *directory == "." && runtime.GOOS == "darwin" {
		*directory = getCurrentDirectory()
	}
	log.Println(*directory)
	flag.Parse()

	mgr := NewGameMgr()

	r := gin.New()
	setupTetris(&mgr, r, *directory)

	r.Run(":" + *port)
}

func serveWs(mgr *GamesMgr, room string, w http.ResponseWriter, r *http.Request) {
	log.Println("WebSocket link")

	cookie, _ := r.Cookie("token")
	token := ""
	resp := make(http.Header)
	if cookie == nil {
		token = fmt.Sprintf("%d", Count)
		Count++
	} else {
		token = cookie.Value
		resp.Add("Set-Cookie", "token="+token)
	}

	conn, _ := upgrader.Upgrade(w, r, resp)
	game := mgr.Gain(room)

	if game == nil {
		data := websocket.FormatCloseMessage(InvalidPath.Code, InvalidPath.Text)
		conn.WriteControl(websocket.CloseMessage, data, time.Now().Add(1000))
		conn.Close()
		return
	}

	if game.TryJoin(token, conn) == false {
		conn.Close()
	}
}

func setupTetris(mgr *GamesMgr, r *gin.Engine, dir string) {
	r.GET("/tetris/:room", func(c *gin.Context) {
		http.ServeFile(c.Writer, c.Request, dir+"/tetris/index.html")
	})

	r.GET("/tetris", func(c *gin.Context) {
		room := xid.New()
		http.Redirect(c.Writer, c.Request, "/tetris/"+room.String(), 307)
	})

	r.Static("/static", dir+"/tetris/static")

	r.GET("/ws/tetris/:room", func(c *gin.Context) {
		room := c.Param("room")
		serveWs(mgr, room, c.Writer, c.Request)
	})
}
