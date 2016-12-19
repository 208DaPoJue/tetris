export
enum Statu {
    waitting = 0,
    pause,
    start,
	run,
	end,
}

export
enum ClientCommand {
	join = 0,
	update,
	leave,
	start,
    pause,
}

export
enum ServerCommand {
    start = 0,
    pause,
    update,
}


export
interface TetrisSprite {
	type: number;
	state: number;
    pos: number[];
}


export
interface GameData {
    score: number;
    sprite?: TetrisSprite;
    grid: number[];
    status: number;
}

export
interface ServerMessage{
	code:       ServerCommand;
	self ?:     GameData;
	other ?:    GameData;
}


export
interface ClientMessage {
    code: ClientCommand;
    data ?: GameData;
}