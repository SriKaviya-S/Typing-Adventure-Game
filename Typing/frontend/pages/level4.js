import React, { useState, useEffect, useRef } from "react";
import "../../App.css";
import back from "../../images/backgrou.mp4";
import obstacle1 from "../../images/Obstacle_1.png";
import obstacle2 from "../../images/Obstacle_2.png";
import obstacle3 from "../../images/Obstacle_3.png";
import obstacle4 from "../../images/Obstacle_4.png";
import obstacle5 from "../../images/Obstacle_5.png";
import user from "../../images/boy-running.gif";
import jumpSound from "../../images/jumop.mp3";
import bgmusic from "../../images/bg_music.mp3";

const obstacles = [obstacle1, obstacle2, obstacle3, obstacle4, obstacle5];

const level4Words = [
  "raw", "dry", "spy", "cry", "fly", "pry", "try", "why", "buy", "gym",
  "hymn", "myth", "sync", "type", "wave", "year", "zone", "zero", "yet", "web",
  "use", "two", "the", "tax", "sun", "run", "red", "put", "cat", "dog",
  "hat", "bat", "rat", "sat", "fat", "map", "nap", "tap", "cap", "gap"
];

function Level4Game() {
  const [obstacleList, setObstacleList] = useState([]);
  const [runnerPosition, setRunnerPosition] = useState(10);
  const [gameOver, setGameOver] = useState(false);
  const [typedWord, setTypedWord] = useState("");
  const [timeLeft, setTimeLeft] = useState(60); // Increased time for Level 4
  const [currentWord, setCurrentWord] = useState("");
  const [jumping, setJumping] = useState(false);
  const [score, setScore] = useState(0);
  const [wordsCompleted, setWordsCompleted] = useState(0);
  const [collisionAnimation, setCollisionAnimation] = useState(false);
  const [allWordsCompleted, setAllWordsCompleted] = useState(false);
  const [levelUpdated, setLevelUpdated] = useState(false);
  const [processedWords] = useState(new Set());
  const [obstacleSpeed, setObstacleSpeed] = useState(1.0); // Slower initial speed for Level 4

  const videoRef = useRef(null);
  const runnerRef = useRef(null);
  const audioRef = useRef(null);
  const bgMusicRef = useRef(null);

  const calculateProgress = () => {
    return `${wordsCompleted}/${level4Words.length} words`;
  };

  const updateLevelInDatabase = async () => {
    try {
      const storedUsername = localStorage.getItem('username');
      
      if (!storedUsername) {
        console.error("Username not found in localStorage");
        return;
      }
      
      const response = await fetch('http://localhost:2000/api/levelUp', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: storedUsername }),
      });
      
      const data = await response.json();
      
      if (data.message === 'Level increased successfully') {
        setLevelUpdated(true);
      }
    } catch (error) {
      console.error("Error updating level:", error);
    }
  };

  useEffect(() => {
    if (gameOver && wordsCompleted === level4Words.length && !levelUpdated) {
      updateLevelInDatabase();
    }
  }, [gameOver, wordsCompleted, levelUpdated]);

  useEffect(() => {
    if (timeLeft > 0 && !gameOver && !allWordsCompleted) {
      const timer = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
        setObstacleSpeed(prev => Math.min(prev + 0.01, 2.0)); // Slower speed increase for Level 4
      }, 1000);
      return () => clearInterval(timer);
    } else if (timeLeft <= 0 || allWordsCompleted) {
      setGameOver(true);
    }
  }, [timeLeft, gameOver, allWordsCompleted]);

  useEffect(() => {
    if (gameOver || allWordsCompleted) {
      if (videoRef.current) videoRef.current.pause();
      if (runnerRef.current) runnerRef.current.style.display = "none";
      if (bgMusicRef.current) bgMusicRef.current.pause();
      return;
    }

    if (bgMusicRef.current) {
      bgMusicRef.current.volume = 0.3;
      bgMusicRef.current.play();
    }

    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex >= level4Words.length) {
        setAllWordsCompleted(true);
        clearInterval(interval);
        return;
      }

      const randomObstacle = obstacles[Math.floor(Math.random() * obstacles.length)];
      const newWord = level4Words[currentIndex];
      setCurrentWord(newWord);

      const newObstacle = {
        image: randomObstacle,
        word: newWord,
        position: {
          bottom: "12%",
          left: "100%",
        },
      };
      setObstacleList((prevObstacles) => [...prevObstacles, newObstacle]);
      currentIndex++;
    }, 2000); // Slower obstacle spawn rate for Level 4

    return () => clearInterval(interval);
  }, [gameOver, allWordsCompleted]);

  useEffect(() => {
    const moveObstacles = setInterval(() => {
      setObstacleList((prevObstacles) => {
        return prevObstacles.map((obstacle) => {
          const newLeft = parseFloat(obstacle.position.left) - obstacleSpeed;
          
          if (
            newLeft < 15 && 
            newLeft > 0 && 
            obstacle.word.trim().toLowerCase() === typedWord.trim().toLowerCase() &&
            !processedWords.has(obstacle.word)
          ) {
            processedWords.add(obstacle.word);
            handleWordMatch();
            return null;
          }

          if (newLeft < 15 && newLeft > 0 && runnerPosition <= 15) {
            const isWordMatched = typedWord.trim().toLowerCase() === obstacle.word.trim().toLowerCase();
            if (!isWordMatched) {
              setCollisionAnimation(true);
              setTimeout(() => {
                setCollisionAnimation(false);
                setGameOver(true);
              }, 500);
              return null;
            }
          }

          if (newLeft <= -20) {
            return null;
          }

          return {
            ...obstacle,
            position: {
              ...obstacle.position,
              left: `${newLeft}%`,
            },
          };
        }).filter(Boolean);
      });
    }, 30);

    return () => clearInterval(moveObstacles);
  }, [typedWord, gameOver, runnerPosition, obstacleSpeed]);
  
  useEffect(() => {
    if (jumping) {
      setRunnerPosition(40);
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.volume = 0.9;
        audioRef.current.play();
      }
    } else {
      setRunnerPosition(10);
    }
  }, [jumping]);

  const handleWordMatch = () => {
    setJumping(true);
    const basePoints = currentWord.length === 3 ? 10 : 15; // Adjusted points for Level 4
    setScore(prevScore => prevScore + basePoints);
    setWordsCompleted(prev => prev + 1);
    setTimeout(() => setJumping(false), 500);
    setTypedWord("");

    if (wordsCompleted + 1 === level4Words.length) {
      setAllWordsCompleted(true);
    }
  };

  const handleInputChange = (event) => {
    setTypedWord(event.target.value);
  };

  const restartGame = () => {
    setObstacleList([]);
    setRunnerPosition(10);
    setGameOver(false);
    setTypedWord("");
    setTimeLeft(90);
    setCurrentWord("");
    setJumping(false);
    setScore(0);
    setWordsCompleted(0);
    setCollisionAnimation(false);
    setAllWordsCompleted(false);
    setLevelUpdated(false);
    setObstacleSpeed(1.0);
    processedWords.clear();

    if (videoRef.current) {
      videoRef.current.play();
    }
    if (runnerRef.current) {
      runnerRef.current.style.display = "block";
    }
    if (bgMusicRef.current) {
      bgMusicRef.current.currentTime = 0;
      bgMusicRef.current.play();
    }
  };

  const levelPassed = wordsCompleted === level4Words.length;

  return (
    <div className="App" style={{ backgroundColor: "black", height: "100vh" }}>
      <div className="game-container" style={{
        position: "relative",
        height: "100vh",
        width: "100vw",
        margin: "0",
        overflow: "hidden",
      }}>
        {/* Video Background */}
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          style={{
            position: "absolute",
            top: "0",
            left: "0",
            width: "100%",
            height: "100%",
            objectFit: "cover",
            zIndex: -1,
          }}
        >
          <source src={back} type="video/mp4" />
        </video>

        {/* Level Heading */}
        <div style={{
          position: "absolute",
          top: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          color: "#4CAF50",
          fontSize: "24px",
          fontWeight: "bold",
          textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
          background: "rgba(0,0,0,0.7)",
          padding: "10px 20px",
          borderRadius: "10px",
          zIndex: "1"
        }}>
          Level 4 - Intermediate
        </div>

        {/* Progress Display */}
        <div style={{
          position: "absolute",
          top: "70px",
          right: "20px",
          color: "white",
          fontSize: "18px",
          fontWeight: "bold",
          background: "rgba(0,0,0,0.7)",
          padding: "10px",
          borderRadius: "10px",
          zIndex: "1"
        }}>
          Progress: {calculateProgress()}
        </div>

        {/* Timer Display */}
        <div style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          color: timeLeft <= 20 ? "#ff4444" : "white",
          fontSize: "20px",
          fontWeight: "bold",
          background: "rgba(0,0,0,0.7)",
          padding: "10px",
          borderRadius: "10px",
          zIndex: "1"
        }}>
          Time: {timeLeft}s
        </div>

        {/* Score Display */}
        <div style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          color: "white",
          fontSize: "20px",
          fontWeight: "bold",
          background: "rgba(0,0,0,0.7)",
          padding: "10px",
          borderRadius: "10px",
          zIndex: "1"
        }}>
          Score: {score}
        </div>

        {/* Game Over Screen */}
        {gameOver && (
          <div style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "rgba(0,0,0,0.9)",
            padding: "20px",
            borderRadius: "15px",
            color: "white",
            textAlign: "center",
            zIndex: "2"
          }}>
            <h2 style={{ color: "Green" }}>{allWordsCompleted ? "Level Complete!" : "Game Over!"}</h2>
            <p>Final Score: {score}</p>
            <p>Words Completed: {wordsCompleted}/{level4Words.length}</p>
            
            {levelPassed ? (
              <p style={{ color: "#FF9800" }}>
                Congratulations! All words completed! {levelUpdated ? "Progress saved!" : "Saving progress..."} 
                You can proceed to Level 5!
              </p>
            ) : (
              <p style={{ color: "#ff4444" }}>
                Try again! You need to complete all {level4Words.length} words to pass the level.
              </p>
            )}
            
            <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "20px" }}>
              <button
                onClick={restartGame}
                style={{
                  padding: "10px 20px",
                  background: "linear-gradient(to right, rgb(30, 255, 0), rgb(41, 77, 0))",
                  border: "none",
                  borderRadius: "5px",
                  color: "white",
                  cursor: "pointer"
                }}
              >
                Retry Level
              </button>
              
              {levelPassed && (
                <>
                  <button
                    onClick={() => window.location.href = "/l5"}
                    style={{
                      padding: "10px 20px",
                      background: "linear-gradient(to right, #2196F3, #1976D2)",
                      border: "none",
                      borderRadius: "5px",
                      color: "white",
                      cursor: "pointer"
                    }}
                  >
                    Next Level
                  </button>
                  <button
                    onClick={() => window.location.href = "/levels"}
                    style={{
                      padding: "10px 20px",
                      background: "linear-gradient(to right, #2196F3, #1976D2)",
                      border: "none",
                      borderRadius: "5px",
                      color: "white",
                      cursor: "pointer"
                    }}
                  >
                    Levels Page
                  </button>
                </>
              )}
              
              <button
                onClick={() => window.location.href = "/home"}
                style={{
                  padding: "10px 20px",
                  background: "linear-gradient(to left, #ff9800, rgb(90, 49, 7))",
                  border: "none",
                  borderRadius: "5px",
                  color: "white",
                  cursor: "pointer"
                }}
              >
                Main Menu
              </button>
            </div>
          </div>
        )}

        {/* Word Display */}
        <div className="word-display" style={{
          position: "absolute",
          top: "80px",
          left: "50%",
          transform: "translateX(-50%)",
          fontSize: "24px",
          color: "white",
          textAlign: "center",
          zIndex: "1"
        }}>
          <span style={{
            display: "inline-block",
            padding: "5px 15px",
            background: "linear-gradient(to right, #4CAF50, #45a049)",
            borderRadius: "10px",
            boxShadow: "0 0 10px rgba(76, 175, 80, 0.8)",
            textShadow: "2px 2px 4px rgba(0,0,0,0.5)"
          }}>
          {currentWord.toUpperCase()}
        </span>
      </div>

      {/* Input Box */}
      <input
        type="text"
        value={typedWord}
        onChange={handleInputChange}
        placeholder="Type the word..."
        style={{
          position: "absolute",
          top: "130px",
          left: "50%",
          transform: "translateX(-50%)",
          padding: "10px",
          fontSize: "18px",
          borderRadius: "5px",
          border: "2px solid #4CAF50",
          background: "rgba(255,255,255,0.9)",
          width: "200px",
          textAlign: "center",
          zIndex: "1"
        }}
        disabled={gameOver}
        autoFocus
      />

      {/* Obstacles */}
      {obstacleList.map((obstacle, index) => (
        <div
          key={index}
          style={{
            position: "absolute",
            bottom: obstacle.position.bottom,
            left: obstacle.position.left,
            transition: "left 0.03s linear",
          }}
        >
          <div style={{
            textAlign: "center",
            color: "white",
            fontSize: "20px",
            fontWeight: "bold",
            marginBottom: "120px",
            textShadow: "2px 2px 4px rgba(0,0,0,0.7)"
          }}>
            {obstacle.word.toUpperCase()}
          </div>
          <img
            src={obstacle.image}
            alt="obstacle"
            style={{
              width: "80px",
              height: "120px",
              position: "absolute",
              bottom: `${(runnerPosition / 10) - 40}px`,
            }}
          />
        </div>
      ))}

      {/* Runner */}
      <div
        ref={runnerRef}
        style={{
          position: "absolute",
          bottom: `${runnerPosition}%`,
          left: "10%",
          transition: "bottom 0.3s",
          animation: collisionAnimation ? "shake 0.1s" : "none",
          zIndex: "1"
        }}
      >
        <img
          src={user}
          alt="runner"
          style={{
            width: "100px",
            height: "175px"
          }}
        />
      </div>

      {/* Audio Elements */}
      <audio ref={audioRef} src={jumpSound} preload="auto"></audio>
      <audio ref={bgMusicRef} src={bgmusic} loop preload="auto"></audio>

      {/* CSS Styles */}
      <style>
        {`
          @keyframes shake {
            0% { transform: translateX(0); }
            25% { transform: translateX(-10px); }
            50% { transform: translateX(10px); }
            75% { transform: translateX(-10px); }
            100% { transform: translateX(0); }
          }

          .typing-input:focus {
            outline: none;
            box-shadow: 0 0 10px #4CAF50;
            transform: scale(1.02);
          }

          button:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
          }

          button {
            transition: all 0.3s ease;
          }

          .word-display span {
            transition: all 0.3s ease;
          }

          .word-display span:hover {
            transform: scale(1.05);
          }
        `}
      </style>
    </div>
  </div>
);
}

export default Level4Game;