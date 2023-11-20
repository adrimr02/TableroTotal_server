import { z } from 'zod';
import type { Game, GameState } from "./Game";

type ControlFunctions = {
  showCountdown: (timeout: number, callback: () => void, isDone?: (counter: number) => boolean) => NodeJS.Timeout;
  finishGame: (results: unknown) => void;
  nextTurn: (players: string[]) => void;
  showResults: (results: unknown) => void;
};

const moveActionParser = z.object({ move: z.enum(['rock', 'paper', 'scissors']) });

export class RockPaperScissors implements Game {
  public static MaxPlayers = 2;

  private game: GameState<RPSState, PlayerState> = {
    config: {
      timeout: 10,
    },
    state: {
      round: 0,
      nextTurn: '',
      moveAllowed: false,
      moves: {},
      isGameOver: false,
      results: {},
    },
    players: {},
  };

  private showCountdown: ControlFunctions['showCountdown'];
  private finishGame: ControlFunctions['finishGame'];
  private nextTurn: ControlFunctions['nextTurn'];
  private showResults: ControlFunctions['showResults'];

  constructor(controlFn: ControlFunctions, players: PlayerInfo[]) {
    this.finishGame = controlFn.finishGame;
    this.showCountdown = controlFn.showCountdown;
    this.nextTurn = controlFn.nextTurn;
    this.showResults = controlFn.showResults;
  
    this.game.players[players[0].id] = {
      id: players[0].id,
      username: players[0].username,
    };
    this.game.players[players[1].id] = {
      id: players[1].id,
      username: players[1].username,
    };
    this.game.state.nextTurn = players[0].id;
  }

  startGameLoop(): void {
    this.isGameOver();
    if (this.game.state.isGameOver) {
      this.finishGame(this.game.state.results);
      return;
    }
    const turn = this.game.state.nextTurn;
    this.nextTurn([turn]);
    this.game.state.moveAllowed = true;
    this.showCountdown(this.game.config.timeout, () => {
      this.game.state.moveAllowed = false;
      if (turn === this.game.state.nextTurn) {
        this.game.state.isGameOver = true;
        this.game.state.results = {
          type: 'timeout',
          winner: this.getOtherPlayer(turn),
        };
      } else {
        this.showResults({ moves: this.game.state.moves });
        this.startGameLoop();
      }
    }, () => {
      return turn !== this.game.state.nextTurn;
    });
  }

  getOtherPlayer(player: string): string {
    for (const otherPlayer of Object.keys(this.game.players)) {
      if (player !== otherPlayer)
        return otherPlayer;
    }
    return 'no_player';
  }

  playerLeave(playerId: string): void {
    this.game.state.isGameOver = true;
    this.game.state.results = {
      type: 'resignation',
      winner: this.getOtherPlayer(playerId),
    };
  }

  move(playerId: string, action: unknown): void {
    if (playerId !== this.game.state.nextTurn || !this.game.state.moveAllowed)
      return; // Not their turn

    try {
      const { move } = moveActionParser.parse(action);
      this.game.state.moves[playerId] = move;

      // Switch turn to the other player
      for (const player of Object.keys(this.game.players)) {
        if (player !== playerId)
          this.game.state.nextTurn = player;
      }
    } catch (error) {}
  }

  isGameOver(): void {
    const player1Move = this.game.state.moves[this.game.players[this.game.state.nextTurn].id];
    const player2Move = this.game.state.moves[this.getOtherPlayer(this.game.state.nextTurn)];

    if (player1Move && player2Move) {
      this.game.state.isGameOver = true;

      if (player1Move === player2Move) {
        this.game.state.results = {
          type: 'draw',
          moves: { player1: player1Move, player2: player2Move },
        };
      } else if ((player1Move === 'rock' && player2Move === 'scissors') ||
                 (player1Move === 'scissors' && player2Move === 'paper') ||
                 (player1Move === 'paper' && player2Move === 'rock')) {
        this.game.state.results = {
          type: 'winner',
          winner: this.game.players[this.game.state.nextTurn].id,
          moves: { player1: player1Move, player2: player2Move },
        };
      } else {
        this.game.state.results = {
          type: 'winner',
          winner: this.getOtherPlayer(this.game.state.nextTurn),
          moves: { player1: player1Move, player2: player2Move },
        };
      }
    }
  }
}

type RPSState = {
  nextTurn: string;
  round: number;
  moveAllowed: boolean;
  moves: Record<string, string>;
} & ({
  isGameOver: false;
  results: Record<string, never>;
} | {
  isGameOver: true;
  results: RPSResults;
});

type RPSResults = {
  type: 'draw';
  moves: Record<string, string>;
} | {
  type: 'winner';
  winner: string;
  moves: Record<string, string>;
} | {
  type: 'timeout';
  winner: string;
} | {
  type: 'resignation';
  winner: string;
};

type PlayerInfo = {
  id: string;
  username: string;
};

type PlayerState = {
  id: string;
  username: string;
};