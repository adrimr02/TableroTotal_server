import { z } from 'zod';

type ControlFunctions = {
  showCountdown: (
    timeout: number,
    callback: () => void,
    isDone?: (counter: number) => boolean
  ) => NodeJS.Timeout;
  finishGame: (results: unknown) => void;
  showResults: (results: unknown) => void;
  showInitialInfo: (info: unknown) => void;
};

type RPSResults =
  | { type: 'draw'; moves: Record<string, string>[] }
  | { type: 'winner'; winner: string; moves: Record<string, string>[] }
  | { type: 'timeout' | 'resignation'; winner: string };

type RPSState = {
  round: number;
  moveAllowed: boolean;
  moves: Record<string, string>[];
  isGameOver: boolean;
  results: RPSResults;
  players: Record<string, PlayerState>;
};

type PlayerInfo = {
  id: string;
  username: string;
  points: number;
};

type PlayerState = PlayerInfo;

type GameState = {
  config: {
    timeout: number;
    maxPlayers: number;
    rounds: number;
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
      rounds: 0,
    },
    state: {
      round: 0,
      moveAllowed: false,
      moves: [],
      isGameOver: false,
      results: { type: 'draw', moves: [] },
      players: {},
    },
    players: {},
  };

  private showCountdown: ControlFunctions['showCountdown'];
  private finishGame: ControlFunctions['finishGame'];
  private showResults: ControlFunctions['showResults'];
  private showInitialInfo: ControlFunctions['showInitialInfo'];

  constructor(controlFn: ControlFunctions, rounds: number) {
    this.finishGame = controlFn.finishGame;
    this.showCountdown = controlFn.showCountdown;
    this.showResults = controlFn.showResults;
    this.showInitialInfo = controlFn.showInitialInfo;
    this.game.config.rounds = rounds;
  }

  startGameLoop(): void {
    this.game.state.moveAllowed = true;

    this.showInitialInfo({
      players: Object.values(this.game.players).map((p, i) => ({
        ...p,
        id: Object.keys(this.game.players)[i],
        points: 0,
      })),
      round: 1,
    });

    this.showCountdown(
      this.game.config.timeout,
      () => {
        this.game.state.moveAllowed = false;
        this.checkRoundResults();
        //this.showResults({ round: this.game.state.round});
        this.startNextRound();
      },
      () => Object.keys(this.game.state.moves).length === Object.keys(this.game.players).length
    );
  }

  startNextRound(): void {
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
        console.log("Termino la ronda actual", this.game.state.round)
        this.game.state.moveAllowed = false;
        this.checkRoundResults();

        //this.showResults({ moves: this.game.state.moves });
        //this.game.state.round++;
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

    if (!playerInfo.username) {
      console.error(`El jugador (${playerInfo.id}) no tiene un nombre de usuario.`);
      return false;
    }

    this.game.players[playerInfo.id] = { ...playerInfo };
    this.game.players[playerInfo.id].points = 0;
    return true;
  }


  move(playerId: string, action: unknown): void {
    if (!this.game.state.moveAllowed) return;

    try {
      const move = moveActionParser.parse(action);

      // Asegúrate de que this.game.state.moves[this.game.state.round] sea un array
      if (!this.game.state.moves[this.game.state.round]) {
        this.game.state.moves[this.game.state.round] = {};
      }

      this.game.state.moves[this.game.state.round][playerId] = move;
    } catch (error) {
      // Manejar el error de análisis si es necesario
      console.error(`Error al parsear la acción del jugador (${playerId}):`, error);
    }
  }


  checkRoundResults(): void {
    const currentRoundMoves = this.game.state.moves[this.game.state.round];
    console.log(currentRoundMoves)

    if (
      currentRoundMoves // &&
      //typeof currentRoundMoves === 'object' &&
      //Object.keys(currentRoundMoves).length === Object.keys(this.game.players).length
    ) {
      this.game.state.moveAllowed = false;

      this.compareMoves();

      // Obtén los resultados por jugador
      const resultadosPorJugador = Object.keys(this.game.players).map((idJugador) => {
        const jugador = this.game.players[idJugador];
        return {
          id: idJugador,
          puntos: jugador.points,
        };
      });

      // Asigna los puntos a cada jugador
      /*
      Object.keys(this.game.players).forEach((nombreJugador) => {
        const jugador = this.game.players[nombreJugador];
  
        // Verifica si el jugador participó en la ronda actual
        const puntosEnEstaRonda = currentRoundMoves[nombreJugador]
          ? 1  // Asigna 1 punto si el jugador participó en la ronda
          : 0; // No asigna puntos si el jugador no participó
  
        // Asigna los puntos al jugador
        jugador.points += puntosEnEstaRonda;
      });
      */

      // Obtén los resultados actualizados por jugador
      const roundPoints: Record<string, number> = Object.fromEntries(
        resultadosPorJugador.map((result) => [result.id, result.puntos])
      );
      console.log("roundPoints", roundPoints)
      console.log("Ronda actual", this.game.state.round)

      // Llama al método showResults con los resultados
      this.showResults({ round: this.game.state.round, points: roundPoints });

      this.game.state.round++;
    }
  }

  compareMoves(): void {
    const currentRoundMoves = this.game.state.moves[this.game.state.round];
    const players = Object.keys(this.game.players);


    // Verificar si la ronda actual es un empate
    const isDraw = players.every(player => currentRoundMoves[player] === currentRoundMoves[this.getOtherPlayer(player)]);

    if (isDraw) {
      // La ronda es un empate, no se asignan puntos
      return;
    }

    // Verificar si hay un ganador en la ronda actual
    for (const player of players) {
      const move = currentRoundMoves[player];
      const otherPlayer = this.getOtherPlayer(player);
      const otherMove = currentRoundMoves[otherPlayer];

      if (
        ((move === 'rock' && otherMove === 'scissors') ||
          (move === 'scissors' && otherMove === 'paper') ||
          (move === 'paper' && otherMove === 'rock'))
        || (move && !otherMove)
      ) {
        // El jugador gana la ronda, asignar puntos
        this.game.players[player].points++;
      }

    }
  }

  isGameOver(): void {
    const rounds = this.game.state.moves;

    if (rounds.length === 0) {
      return; // No rounds played yet
    }

    if (this.game.state.round === this.game.config.rounds) {
      const players = Object.keys(this.game.players);
      const playerWins: Record<string, number> = {};

      const winner = Object.keys(playerWins).reduce((prev, curr) =>
        playerWins[curr] > playerWins[prev] ? curr : prev,
        'no_player'
      );

      const moves: Record<string, string>[] = rounds.map((round) => {
        const moveRound: Record<string, string> = {};
        players.forEach((player) => {
          moveRound[player] = round[player] || '';
        });
        return moveRound;
      });
      this.game.state.isGameOver = true;
      this.game.state.results = {
        type: 'winner',
        winner: winner !== 'no_player' ? winner : 'draw',
        moves: moves,
      };
    }
  }

  getOtherPlayer(player: string): string {
    for (const otherPlayer of Object.keys(this.game.players)) {
      if (player !== otherPlayer) return otherPlayer;
    }
    return 'no_player';
  }
}

const moveActionParser = z.enum(['rock', 'paper', 'scissors']);
