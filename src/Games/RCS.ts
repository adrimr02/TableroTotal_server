import { z } from 'zod';

type ControlFunctions = {
  showCountdown: (
    timeout: number,
    callback: () => void,
    isDone?: (counter: number) => boolean
  ) => NodeJS.Timeout;
  finishGame: (results: unknown) => void;
  showResults: (results: unknown) => void;
};

type RPSResults =
  { type: 'draw'; moves: Record<string, string>[] }
  | { type: 'winner'; winner: string; moves: Record<string, string>[] }
  | { type: 'timeout' | 'resignation'; winner: string };

type RPSState = {
  round: number;
  moveAllowed: boolean;
  moves: Record<string, string>[];
  isGameOver: boolean;
  results: RPSResults;
};

type PlayerInfo = {
  id: string;
  username: string;
};

type PlayerState = PlayerInfo;

type GameState = {
  config: {
    timeout: number;
    maxPlayers: number;
  };
  state: RPSState;
  players: Record<string, PlayerState>;
};

export class RockPaperScissors {
  public static MaxPlayers = 2;

  private game: GameState = {
    config: {
      timeout: 10,
      maxPlayers: RockPaperScissors.MaxPlayers,
    },
    state: {
      round: 0,
      moveAllowed: false,
      moves: [],
      isGameOver: false,
      results: { type: 'draw', moves: [] },
    },
    players: {},
  };

  private showCountdown: ControlFunctions['showCountdown'];
  private finishGame: ControlFunctions['finishGame'];
  private showResults: ControlFunctions['showResults'];

  constructor(controlFn: ControlFunctions) {
    this.finishGame = controlFn.finishGame;
    this.showCountdown = controlFn.showCountdown;
    this.showResults = controlFn.showResults;
  }

  startGameLoop(): void {
    this.game.state.moveAllowed = true;

    this.showCountdown(
      this.game.config.timeout,
      () => {
        this.game.state.moveAllowed = false;
        // Todos los jugadores movieron
        this.showResults({ moves: this.game.state.moves });
        this.startNextRound();
      },
      () => Object.keys(this.game.state.moves).length === Object.keys(this.game.players).length
    );
  }

  startNextRound(): void {
    // this.game.state.round++;

    this.isGameOver();
    if (this.game.state.isGameOver) {
      this.finishGame(this.game.state.results);
      return;
    }

    this.game.state.moves[this.game.state.round] = {};
    this.game.state.moveAllowed = true;

    this.showCountdown(
      this.game.config.timeout,
      () => {
        this.game.state.moveAllowed = false;
        this.showResults({ moves: this.game.state.moves });
        this.game.state.round++;
        this.startNextRound();
      },
      () => Object.keys(this.game.state.moves).length === Object.keys(this.game.players).length
    );
  }

  playerLeave(playerId: string): void {
    this.game.state.isGameOver = true;
    this.game.state.results = {
      type: 'resignation',
      winner: this.getOtherPlayer(playerId),
    };
    this.finishGame(this.game.state.results);
  }

  addPlayer(playerInfo: PlayerInfo): boolean {
    if (Object.keys(this.game.players).length === this.game.config.maxPlayers) return false;

    this.game.players[playerInfo.id] = { ...playerInfo };
    return true;
  }

  move(playerId: string, action: unknown): void {
    if (!this.game.state.moveAllowed) return;

    try {
      const { move } = moveActionParser.parse(action);
      this.game.state.moves[this.game.state.round][playerId] = move;
    } catch (error) {}
  }

  isGameOver(): void {
    const rounds = this.game.state.moves;
  
    if (rounds.length === 0) {
      return; // No rounds played yet
    }
  
    const players = Object.keys(this.game.players);
    const playerWins: Record<string, number> = {};
  
    for (let i = 0; i < rounds.length; i++) {
      const round = rounds[i];
  
      for (const player of players) {
        const move = round[player];
  
        if (move === undefined) {
          continue;
        }
  
        if (move === round[this.getOtherPlayer(player)]) {
          // Draw
        } else if (
          (move === 'rock' && round[this.getOtherPlayer(player)] === 'scissors') ||
          (move === 'scissors' && round[this.getOtherPlayer(player)] === 'paper') ||
          (move === 'paper' && round[this.getOtherPlayer(player)] === 'rock')
        ) {
          // Player wins
          playerWins[player] = (playerWins[player] || 0) + 1;
        }
      }
    }
  
    // Determine the player with the most victories
    const winner = Object.keys(playerWins).reduce((prev, curr) =>
      playerWins[curr] > playerWins[prev] ? curr : prev
    );
  
    // Create a new array with the moves of each round
    const moves: Record<string, string>[] = rounds.map((round) => {
      const moveRound: Record<string, string> = {};
      for (const player of players) {
        moveRound[player] = round[player] || ''; 
      }
      return moveRound;
    });
  
    this.game.state.isGameOver = true;
    this.game.state.results = {
      type: 'winner',
      winner: winner !== 'no_player' ? winner : 'draw',
      moves: moves,
    };
  }
  
  

  getOtherPlayer(player: string): string {
    for (const otherPlayer of Object.keys(this.game.players)) {
      if (player !== otherPlayer) return otherPlayer;
    }
    return 'no_player';
  }
}

const moveActionParser = z.object({ move: z.enum(['rock', 'paper', 'scissors']) });
