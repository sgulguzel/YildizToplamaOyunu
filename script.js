let paddle = document.getElementById("paddle");
let ball = document.getElementById("ball");
let pauseMenu = document.getElementById("pause-menu");
let resumeButton = document.getElementById("resume");
let restartButton = document.getElementById("restart");
let pauseButton = document.getElementById("pause-button");
let stars = [];
let paddleX = 425;
let ballX = 487;
let ballY = 560;
let ballDX = 5;
let ballDY = -5;
let score = 0;
let lives = 3;
let currentLevel = 1;
let isPaused = false;
let gameOver = false;
let gameTime = 0;
let lastTime = performance.now();
let gameStartTime;
let paddleSpeed = 30;
let isMovingLeft = false;
let isMovingRight = false;
let bonusStar, lifePack;
let bonusActive = false;
let lifePackActive = false;

// Bu dizi, her seviyede kaç yıldız olacağını, topun hızını ve çubuğun genişliğini belirler
const levelSettings = [
    { stars: 5, ballSpeed: 5, paddleWidth: 150 },
    { stars: 10, ballSpeed: 7, paddleWidth: 130 },
    { stars: 15, ballSpeed: 8, paddleWidth: 110 }
];

// FPS Göstergesi Oluşturma
let fpsDisplay = document.createElement('div');
fpsDisplay.style.position = 'absolute';
fpsDisplay.style.color = 'white';
fpsDisplay.style.top = '10px';
fpsDisplay.style.left = '10px';
fpsDisplay.style.zIndex = '10';
fpsDisplay.style.fontSize = '20px';
fpsDisplay.style.fontFamily = 'Arial, sans-serif';
fpsDisplay.innerText = 'FPS: 0';
document.getElementById('game-container').appendChild(fpsDisplay);

// Oyunun başladığı andan itibaren geçen süreyi günceller
function updateTimer() {
    if (!isPaused && !gameOver) {
        const elapsed = Math.floor((Date.now() - gameStartTime) / 1000);
        document.getElementById('timer').innerText = `Süre: ${elapsed}`;
    }
}

// Klavye Kontrolleri (Paddle Hareketi)
document.addEventListener("keydown", function(e) {
    if (!isPaused && !gameOver) {
        if (e.key === "ArrowLeft") {
            isMovingLeft = true;
            e.preventDefault();
        } else if (e.key === "ArrowRight") {
            isMovingRight = true;
            e.preventDefault();
        }
    }
});

document.addEventListener("keyup", function(e) {
    if (e.key === "ArrowLeft") {
        isMovingLeft = false;
        e.preventDefault();
    } else if (e.key === "ArrowRight") {
        isMovingRight = false;
        e.preventDefault();
    }
});

// Bu fonksiyon, paddle'ın her karede hareketini kontrol eder
function movePaddle() {
    if (isMovingLeft && paddleX > 0) {
        paddleX -= paddleSpeed;
    }
    if (isMovingRight && paddleX < (window.innerWidth - paddle.offsetWidth)) {
        paddleX += paddleSpeed;
    }
    paddle.style.left = `${paddleX}px`;
}

// Yıldız Oluşturma
function createStars(level) {
    const container = document.getElementById('game-container');
    stars = [];
    document.querySelectorAll('.star').forEach(star => star.remove());

    for (let i = 0; i < levelSettings[level - 1].stars; i++) {
        const star = document.createElement('div');
        star.classList.add('star');
        star.style.left = `${Math.random() * 950}px`;
        star.style.top = `${Math.random() * 400 + 50}px`;
        container.appendChild(star);
        stars.push(star);
    }
}

// Topun Hareketi ve Çarpışma Kontrolü
let fps = 0;
let frameCount = 0;
let lastFpsUpdateTime = performance.now();//FPS değerinin son güncellenme zaman

function moveBall(time) {
    if (!isPaused && !gameOver) {
        const deltaTime = (time - lastTime) / 16;
        lastTime = time;

        ballX += ballDX * deltaTime;
        ballY += ballDY * deltaTime;

        // Sağ ve sol duvarlara çarpma kontrolü
        if (ballX <= 0 || ballX >= (window.innerWidth - ball.offsetWidth)) {
            ballDX *= -1;
        }

        // Üst duvara çarpma kontrolü
        if (ballY <= 0) {
            ballDY *= -1;
        }

        // Paddle çarpışma kontrolü
        if (ballY >= (window.innerHeight - paddle.offsetHeight - ball.offsetHeight) && 
            ballX >= paddleX && 
            ballX <= paddleX + paddle.offsetWidth) {
            ballDY *= -1;
        }

        // Topun ekranın altına düşmesi kontrolü
        if (ballY > window.innerHeight) {
            resetBall();
        }

        stars.forEach(star => {
            checkCollisionWithStar(star);
        });

        checkCollisionWithBonus();

        ball.style.left = `${ballX}px`;
        ball.style.top = `${ballY}px`;

        updateTimer();

        // FPS hesaplama ve gösterme
        frameCount++;//// Her karede frameCount bir artırılır
        const now = performance.now();
        if (now - lastFpsUpdateTime >= 1000) {
            fps = frameCount;
            frameCount = 0;
            lastFpsUpdateTime = now;
            fpsDisplay.innerText = `FPS: ${fps}`;
        }
    }

    movePaddle();
    requestAnimationFrame(moveBall);
}

function checkCollisionWithStar(star) {
    const starRect = star.getBoundingClientRect();
    const ballRect = ball.getBoundingClientRect();
    if (ballRect.left < starRect.right && ballRect.right > starRect.left && ballRect.top < starRect.bottom && ballRect.bottom > starRect.top) {
        star.remove();
        stars = stars.filter(s => s !== star);
        updateScore();

        if (stars.length === 0) {
            nextLevel();
        }
    }
}

function updateScore() {
    score += 10;
    document.getElementById('score').innerText = `Puan: ${score}`;
}

function nextLevel() {
    currentLevel += 1;
    if (currentLevel <= levelSettings.length) {
        ballDX = levelSettings[currentLevel - 1].ballSpeed;
        ballDY = -levelSettings[currentLevel - 1].ballSpeed;
        paddle.style.width = `${levelSettings[currentLevel - 1].paddleWidth}px`;
        createStars(currentLevel);
    } else {
        endGame("Tebrikler! Tüm seviyeleri geçtiniz.");
    }
}

function resetBall() {
    ballX = 487;
    ballY = 560;
    ballDX = levelSettings[currentLevel - 1].ballSpeed;
    ballDY = -levelSettings[currentLevel - 1].ballSpeed;
    lives -= 1;
    document.getElementById('lives').innerText = `Can: ${lives}`;
    
    if (lives === 0) {
        endGame("Oyun bitti! Canlar tükendi.");
    }
}

function endGame(message) {
    gameOver = true;
    isPaused = true;
    pauseMenu.style.display = 'block';
    document.getElementById('resume').style.display = 'none';
    alert(message);
}

function pauseGame() {
    if (!gameOver) {
        isPaused = true;
        pauseMenu.style.display = 'block';
    }
}

function resumeGame() {
    if (isPaused) {
        isPaused = false;
        pauseMenu.style.display = 'none';
        lastTime = performance.now();
    }
}

function restartGame() {
    location.reload();
}

pauseButton.addEventListener("click", function() {
    if (!isPaused && !gameOver) {
        pauseGame();
    }
});

resumeButton.addEventListener("click", resumeGame);
restartButton.addEventListener("click", restartGame);

function spawnBonusItems() {
    if (bonusActive || lifePackActive) {
        return;
    }
    if (Math.random() < 0.5) {
        createBonusStar();
    } else {
        createLifePack();
    }
}

function createBonusStar() {
    bonusStar = document.getElementById("bonus-star");
    bonusStar.style.left = `${Math.random() * 950}px`;
    bonusStar.style.top = `${Math.random() * 400 + 50}px`;
    bonusStar.style.display = "block";
    bonusActive = true;

    setTimeout(() => {
        bonusStar.style.display = "none";
        bonusActive = false;
    }, 5000);
}

function createLifePack() {
    lifePack = document.getElementById("life-pack");
    lifePack.style.left = `${Math.random() * 950}px`;
    lifePack.style.top = `${Math.random() * 400 + 50}px`;
    lifePack.style.display = "block";
    lifePackActive = true;

    setTimeout(() => {
        lifePack.style.display = "none";
        lifePackActive = false;
    }, 5000);
}

function checkCollisionWithBonus() {
    if (bonusActive) {
        const bonusRect = bonusStar.getBoundingClientRect();
        const ballRect = ball.getBoundingClientRect();
        if (ballRect.left < bonusRect.right && ballRect.right > bonusRect.left && ballRect.top < bonusRect.bottom && ballRect.bottom > bonusRect.top) {
            score += 50;
            document.getElementById("score").innerText = `Puan: ${score}`;
            bonusStar.style.display = "none";
            bonusActive = false;
        }
    }

    if (lifePackActive) {
        const lifeRect = lifePack.getBoundingClientRect();
        const ballRect = ball.getBoundingClientRect();
        if (ballRect.left < lifeRect.right && ballRect.right > lifeRect.left && ballRect.top < lifeRect.bottom && ballRect.bottom > lifeRect.top) {
            lives += 1;
            document.getElementById("lives").innerText = `Can: ${lives}`;
            lifePack.style.display = "none";
            lifePackActive = false;
        }
    }
}

// Oyuna Başla butonuna tıklandığında oyun başlasın
document.getElementById("start-button").addEventListener("click", function() {
    document.getElementById("welcome-screen").style.display = "none"; // Giriş ekranını gizle
    document.getElementById("game-container").style.display = "block"; // Oyun alanını göster
    gameStartTime = Date.now(); // Süreyi güncelledik
    startGame(); // Oyunu başlat
});

// Oyunu başlatma fonksiyonu
function startGame() {
    createStars(currentLevel);
    setInterval(spawnBonusItems, 10000);
    requestAnimationFrame(moveBall);
}
