package main

import (
	"flag"
	"fmt"
	"log"
	"net/http"
	"strings"
	"tetris/src"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

func checkOrigin(r *http.Request) bool {
	return true
}

var upgrader = websocket.Upgrader{CheckOrigin: checkOrigin}

var Count int = 0

func main() {
	port := flag.String("p", "8100", "port to serve on")
	directory := flag.String("d", ".", "the directory of static file to host")
	flag.Parse()

	mgr := tetris.NewGameMgr()

	r := gin.New()
	setupTetris(&mgr, r, *directory)

	r.Run(":" + *port)
}

func serveWs(mgr *tetris.GamesMgr, w http.ResponseWriter, r *http.Request) {
	origin := r.Header.Get("Origin")
	if origin == "" {
		return
	}
	log.Println(origin)
	idx := strings.LastIndex(origin, "\\")
	if idx < 0 {
		return
	}
	room := origin[idx+1:]

	cookie, _ := r.Cookie("token")
	token := ""
	resp := make(http.Header)
	if cookie == nil {
		token = fmt.Sprintf("%d", Count)
	} else {
		token = cookie.Value
		resp.Add("Set-Cookie", "token="+token)
	}

	conn, _ := upgrader.Upgrade(w, r, resp)
	game := mgr.Gain(room)

	if game.TryJoin(token, conn) == false {
		conn.Close()
	}
}

func setupTetris(mgr *tetris.GamesMgr, r *gin.Engine, dir string) {
	r.GET("/html/:room", func(c *gin.Context) {
		http.ServeFile(c.Writer, c.Request, dir+"/tetris/index.html")
	})

	r.Static("/static", dir+"/tetris/static")

	r.GET("/ws/tetris", func(c *gin.Context) {
		serveWs(mgr, c.Writer, c.Request)
	})
}
