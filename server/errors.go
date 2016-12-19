package main

type Error struct {
	Code int
	Text string
}

var InvalidPath = Error{Code: 4000, Text: "invalid Path"}
