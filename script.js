// JavaScript for theme toggling, header scroll effect, and music player functionality

document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;

    // Музыкальная визуализация
    const bars = document.querySelectorAll('.bar');
    let animationId;

    function animateVisualizer() {
        bars.forEach((bar, index) => {
            const frequency = parseFloat(bar.dataset.frequency);
            const time = Date.now() * 0.001;
            const noise = Math.sin(time * 2 + index * 0.5) * 0.5 + 0.5;
            const height = 10 + (noise * frequency * 45);
            
            bar.style.height = `${height}px`;
            bar.style.opacity = 0.3 + (noise * 0.7);
        });
        
        animationId = requestAnimationFrame(animateVisualizer);
    }

    // Запускаем анимацию визуализации
    animateVisualizer();

    // Анимация логотипа при наведении
    const logoLetters = document.querySelectorAll('.logo-letter');
    logoLetters.forEach((letter, index) => {
        letter.addEventListener('mouseenter', () => {
            gsap.to(letter, {
                y: -10,
                scale: 1.2,
                color: '#3b82f6',
                duration: 0.3,
                ease: 'power2.out'
            });
        });
        
        letter.addEventListener('mouseleave', () => {
            gsap.to(letter, {
                y: 0,
                scale: 1,
                color: '#f0f0f0',
                duration: 0.3,
                ease: 'power2.out'
            });
        });
    });

    // Music Player Functionality
    const currentSongTitle = document.querySelector('.current-song-title');
    const currentSongArtist = document.querySelector('.current-song-artist');
    const playPauseButton = document.getElementById('play-pause-fixed');
    const prevButton = document.getElementById('prev-fixed');
    const nextButton = document.getElementById('next-fixed');
    const progressBarContainer = document.querySelector('.progress-bar-fixed');
    const progress = document.querySelector('.progress-fixed');
    const currentTimeSpan = document.querySelector('.current-time-fixed');
    const durationSpan = document.querySelector('.duration-fixed');
    const currentAlbumCover = document.querySelector('.current-album-cover');
    
    // Volume controls
    const muteButton = document.getElementById('mute-button');
    const volumeSlider = document.querySelector('.volume-slider');
    const volumeProgress = document.querySelector('.volume-progress');
    const volumeIcon = document.querySelector('.volume-icon');

    const audio = new Audio();
    let currentSongIndex = 0;
    let isPlaying = false;
    let isDragging = false;
    let isMuted = false;
    let lastVolume = 1;

    // Player state management
    const PLAYER_STATE_KEY = 'smusic_player_state';
    
    function savePlayerState() {
        const state = {
            currentSongIndex: currentSongIndex,
            currentTime: audio.currentTime || 0,
            volume: audio.volume || 1,
            isMuted: isMuted,
            lastVolume: lastVolume,
            isPlaying: isPlaying,
            timestamp: Date.now()
        };
        localStorage.setItem(PLAYER_STATE_KEY, JSON.stringify(state));
    }
    
    function loadPlayerState() {
        try {
            const savedState = localStorage.getItem(PLAYER_STATE_KEY);
            if (savedState) {
                const state = JSON.parse(savedState);
                
                // Check if state is not too old (24 hours)
                const isStateValid = (Date.now() - state.timestamp) < 24 * 60 * 60 * 1000;
                
                if (isStateValid) {
                    currentSongIndex = state.currentSongIndex || 0;
                    lastVolume = state.lastVolume || 1;
                    isMuted = state.isMuted || false;
                    
                    // Load song first, then restore time and volume
                    loadSong(songs[currentSongIndex]);
                    
                    // Restore volume and mute state
                    updateVolume(state.volume || 1);
                    if (state.isMuted) {
                        toggleMute();
                    }
                    
                    // Restore playback position after a short delay
                    setTimeout(() => {
                        if (state.currentTime && state.currentTime > 0) {
                            audio.currentTime = state.currentTime;
                        }
                        
                        // Restore playing state if it was playing
                        if (state.isPlaying) {
                            playSong();
                        }
                    }, 100);
                    
                    return true;
                }
            }
        } catch (error) {
            console.log('Error loading player state:', error);
        }
        return false;
    }

    const songs = [
        { title: 'Голый дрищ', artist: 'U.T.T.', src: 'music/song1.mp3', cover: 'images/covers/album1.jpg' },
        { title: 'Автобус', artist: 'U.T.T.', src: 'music/song2.mp3', cover: 'images/covers/album2.jpg' },
        { title: 'Black seven 777', artist: 'Unknown', src: 'music/song3.mp3', cover: 'images/covers/album3.jpg' },
        { title: 'гоблины клеш рояль', artist: 'U.T.T.', src: 'music/song4.mp3', cover: 'images/covers/album4.jpg' },
        { title: 'Весна', artist: 'U.T.T.', src: 'music/song5.mp3', cover: 'images/covers/album.jpg' },
        { title: 'Дождь', artist: 'U.T.T.', src: 'music/song6.mp3', cover: 'images/covers/album.jpg' }
    ];

    function loadSong(song) {
        currentSongTitle.textContent = song.title;
        currentSongArtist.textContent = song.artist;
        audio.src = song.src;
        currentAlbumCover.src = song.cover;
        audio.load();
        
        // Reset progress bar
        progress.style.width = '0%';
        
        // Reset time display
        currentTimeSpan.textContent = '0:00';
        durationSpan.textContent = '0:00';
        
        // Remove playing class
        progressBarContainer.classList.remove('playing');
        
        // Update active track card
        updateActiveTrackCard();
        
        savePlayerState();
    }

    function playSong() {
        isPlaying = true;
        playPauseButton.querySelector('.button-icon').textContent = '⏸';
        playPauseButton.setAttribute('aria-label', 'Поставить на паузу');
        progressBarContainer.classList.add('playing');
        audio.play().catch(error => {
            console.log('Audio playback failed:', error);
            // Show user-friendly message
            showNotification('Воспроизведение недоступно. Проверьте аудиофайлы.');
        });
        savePlayerState();
    }

    function pauseSong() {
        isPlaying = false;
        playPauseButton.querySelector('.button-icon').textContent = '▶';
        playPauseButton.setAttribute('aria-label', 'Воспроизвести');
        progressBarContainer.classList.remove('playing');
        audio.pause();
        savePlayerState();
    }

    function playPauseToggle() {
        if (isPlaying) {
            pauseSong();
        } else {
            playSong();
        }
    }

    function nextSong() {
        currentSongIndex = (currentSongIndex + 1) % songs.length;
        loadSong(songs[currentSongIndex]);
        playSong();
        savePlayerState();
    }

    function prevSong() {
        currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
        loadSong(songs[currentSongIndex]);
        playSong();
        savePlayerState();
    }

    function updateActiveTrackCard() {
        // Remove active class from all cards
        document.querySelectorAll('.track-card').forEach(card => {
            card.classList.remove('active');
        });
        
        // Add active class to current song card
        const trackCards = document.querySelectorAll('.track-card');
        if (trackCards[currentSongIndex]) {
            trackCards[currentSongIndex].classList.add('active');
        }
    }

    function showNotification(message) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #3b82f6;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: var(--shadow);
            z-index: 2000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    // Smooth audio event listeners
    let lastSaveTime = 0;
    
    audio.addEventListener('timeupdate', () => {
        if (!isDragging) {
            const { duration, currentTime } = audio;
            const progressPercent = (currentTime / duration) * 100;
            progress.style.width = `${progressPercent}%`;

            const formatTime = (time) => {
                if (isNaN(time)) return '0:00';
                const minutes = Math.floor(time / 60);
                const seconds = Math.floor(time % 60);
                return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
            };

            currentTimeSpan.textContent = formatTime(currentTime);
            if (duration && !isNaN(duration)) {
                durationSpan.textContent = formatTime(duration);
            } else {
                durationSpan.textContent = '0:00';
            }
            
            // Save state every 5 seconds during playback
            if (isPlaying && Date.now() - lastSaveTime > 5000) {
                savePlayerState();
                lastSaveTime = Date.now();
            }
        }
    });

    audio.addEventListener('ended', nextSong);

    audio.addEventListener('loadedmetadata', () => {
        const formatTime = (time) => {
            if (isNaN(time)) return '0:00';
            const minutes = Math.floor(time / 60);
            const seconds = Math.floor(time % 60);
            return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        };
        
        if (audio.duration && !isNaN(audio.duration)) {
            durationSpan.textContent = formatTime(audio.duration);
        }
    });

    audio.addEventListener('error', (e) => {
        console.log('Audio error:', e);
        showNotification('Ошибка загрузки аудиофайла');
    });

    // Optimized progress bar functionality
    function updateProgress(e) {
        const rect = progressBarContainer.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const width = progressBarContainer.clientWidth;
        const duration = audio.duration;
        
        if (duration && !isNaN(duration)) {
            const progressPercent = (clickX / width) * 100;
            const clampedProgress = Math.max(0, Math.min(100, progressPercent));
            
            // Update progress bar immediately
            progress.style.width = `${clampedProgress}%`;
            
            audio.currentTime = (clickX / width) * duration;
            
            // Save state when user manually changes position
            savePlayerState();
        }
    }

    // Smooth mouse event handlers for progress bar
    progressBarContainer.addEventListener('mousedown', (e) => {
        isDragging = true;
        updateProgress(e);
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            updateProgress(e);
        }
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
    });

    progressBarContainer.addEventListener('click', (e) => {
        if (!isDragging) {
            updateProgress(e);
        }
    });

    // Keyboard shortcuts with throttling
    let keyThrottle = false;
    
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || keyThrottle) return;
        
        keyThrottle = true;
        setTimeout(() => { keyThrottle = false; }, 100);
        
        switch(e.code) {
            case 'Space':
                e.preventDefault();
                playPauseToggle();
                break;
            case 'ArrowRight':
                e.preventDefault();
                nextSong();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                prevSong();
                break;
        }
    });

    // Optimized track card click handlers
    document.querySelectorAll('.track-card').forEach((card, index) => {
        card.addEventListener('click', () => {
            currentSongIndex = index;
            loadSong(songs[currentSongIndex]);
            playSong();
            savePlayerState();
        });

        card.addEventListener('keydown', (e) => {
            if (e.code === 'Enter' || e.code === 'Space') {
                e.preventDefault();
                currentSongIndex = index;
                loadSong(songs[currentSongIndex]);
                playSong();
                savePlayerState();
            }
        });

        // Mouse follow effect
        card.addEventListener('mousemove', (e) => {
            const cardRect = card.getBoundingClientRect();
            const centerX = cardRect.left + cardRect.width / 2;
            const centerY = cardRect.top + cardRect.height / 2;
            const offsetX = (e.clientX - centerX) / cardRect.width;
            const offsetY = (e.clientY - centerY) / cardRect.height;

            const rotateY = offsetX * 20; // Max 20deg rotation
            const rotateX = -offsetY * 20; // Max 20deg rotation
            const scale = 1.05; // Slightly larger scale

            gsap.to(card, {
                duration: 0.3,
                rotationX: rotateX,
                rotationY: rotateY,
                scale: scale,
                ease: "power2.out"
            });
        });

        card.addEventListener('mouseleave', () => {
            gsap.to(card, {
                duration: 0.5,
                rotationX: 0,
                rotationY: 0,
                scale: 1,
                ease: "elastic.out(1, 0.5)"
            });
        });
    });

    // Volume control functions
    function updateVolume(volume) {
        audio.volume = volume;
        volumeProgress.style.width = `${volume * 100}%`;
        
        // Update volume icon
        if (volume === 0) {
            volumeIcon.textContent = '🔇';
        } else if (volume < 0.5) {
            volumeIcon.textContent = '🔉';
        } else {
            volumeIcon.textContent = '🔊';
        }
        
        savePlayerState();
    }

    function toggleMute() {
        if (isMuted) {
            audio.volume = lastVolume;
            updateVolume(lastVolume);
            isMuted = false;
        } else {
            lastVolume = audio.volume;
            audio.volume = 0;
            updateVolume(0);
            isMuted = true;
        }
        savePlayerState();
    }

    function updateVolumeFromSlider(e) {
        const rect = volumeSlider.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const width = volumeSlider.clientWidth;
        const volume = Math.max(0, Math.min(1, clickX / width));
        
        updateVolume(volume);
        isMuted = false;
        savePlayerState();
    }

    // Volume control event listeners
    muteButton.addEventListener('click', toggleMute);
    volumeSlider.addEventListener('click', updateVolumeFromSlider);
    
    let isDraggingVolume = false;
    
    volumeSlider.addEventListener('mousedown', (e) => {
        isDraggingVolume = true;
        updateVolumeFromSlider(e);
    });

    document.addEventListener('mousemove', (e) => {
        if (isDraggingVolume) {
            updateVolumeFromSlider(e);
        }
    });

    document.addEventListener('mouseup', () => {
        isDraggingVolume = false;
    });

    // Player button event listeners
    playPauseButton.addEventListener('click', playPauseToggle);
    prevButton.addEventListener('click', prevSong);
    nextButton.addEventListener('click', nextSong);

    // Initial load for the music player
    const stateLoaded = loadPlayerState();
    
    if (!stateLoaded) {
        // Load default state if no saved state found
        loadSong(songs[currentSongIndex]);
        updateVolume(1); // Set initial volume to 100%
    }
    
    // Save state when page is about to unload
    window.addEventListener('beforeunload', () => {
        savePlayerState();
    });
    
    // Save state when page becomes hidden (user switches tabs)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            savePlayerState();
        }
    });

    // Optimized loading animation
    function addLoadingAnimation() {
        const trackCards = document.querySelectorAll('.track-card');
        trackCards.forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('loading');
                setTimeout(() => {
                    card.classList.remove('loading');
                }, 1000);
            }, index * 100); // Reduced delay for better performance
        });
    }

    // Run loading animation on page load
    addLoadingAnimation();

    // Parallax effect for items
    gsap.registerPlugin(ScrollTrigger);

    document.querySelectorAll('.parallax-item').forEach(item => {
        const speed = parseFloat(item.dataset.speed);
        gsap.to(item, {
            y: (index, target) => -1 * (target.offsetHeight * speed),
            ease: "none",
            scrollTrigger: {
                trigger: item,
                start: "top bottom",
                end: "bottom top",
                scrub: true,
                onUpdate: self => {
                    gsap.to(item, {
                        y: (self.progress - 0.5) * window.innerHeight * speed, // Adjust based on scroll progress
                        ease: "none"
                    });
                }
            }
        });
    });
});

// Кастомный курсор функциональность
document.addEventListener('DOMContentLoaded', () => {
    const cursorRef = document.querySelector('.target-cursor-wrapper');
    const cornersRef = cursorRef?.querySelectorAll(".target-cursor-corner");
    const dotRef = cursorRef?.querySelector(".target-cursor-dot");
    
    if (!cursorRef || !cornersRef || !dotRef) return;

    const targetSelector = ".cursor-target";
    const spinDuration = 2;
    const hideDefaultCursor = true;

    const constants = {
        borderWidth: 3,
        cornerSize: 12,
        parallaxStrength: 0.00005,
    };

    const moveCursor = (x, y) => {
        if (!cursorRef) return;
        gsap.to(cursorRef, {
            x,
            y,
            duration: 0.1,
            ease: "power3.out",
        });
    };

    const originalCursor = document.body.style.cursor;
    if (hideDefaultCursor) {
        document.body.style.cursor = 'none';
        document.body.classList.add('cursor-hidden');
    }

    const cursor = cursorRef;
    let activeTarget = null;
    let currentTargetMove = null;
    let currentLeaveHandler = null;
    let isAnimatingToTarget = false;
    let resumeTimeout = null;
    let spinTl = null;

    const cleanupTarget = (target) => {
        if (currentTargetMove) {
            target.removeEventListener("mousemove", currentTargetMove);
        }
        if (currentLeaveHandler) {
            target.removeEventListener("mouseleave", currentLeaveHandler);
        }
        currentTargetMove = null;
        currentLeaveHandler = null;
    };

    gsap.set(cursor, {
        xPercent: -50,
        yPercent: -50,
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
    });

    const createSpinTimeline = () => {
        if (spinTl) {
            spinTl.kill();
        }
        spinTl = gsap
            .timeline({ repeat: -1 })
            .to(cursor, { rotation: "+=360", duration: spinDuration, ease: "none" });
    };

    createSpinTimeline();

    const moveHandler = (e) => moveCursor(e.clientX, e.clientY);
    window.addEventListener("mousemove", moveHandler);

    const scrollHandler = () => {
        if (!activeTarget || !cursorRef) return;

        const mouseX = gsap.getProperty(cursorRef, "x");
        const mouseY = gsap.getProperty(cursorRef, "y");

        const elementUnderMouse = document.elementFromPoint(mouseX, mouseY);
        const isStillOverTarget = elementUnderMouse && (
            elementUnderMouse === activeTarget ||
            elementUnderMouse.closest(targetSelector) === activeTarget
        );

        if (!isStillOverTarget) {
            if (currentLeaveHandler) {
                currentLeaveHandler();
            }
        }
    };

    window.addEventListener("scroll", scrollHandler, { passive: true });

    // Click animation
    const mouseDownHandler = () => {
        if (!dotRef) return;
        gsap.to(dotRef, { scale: 0.7, duration: 0.3 });
        gsap.to(cursorRef, { scale: 0.9, duration: 0.2 });
    };

    const mouseUpHandler = () => {
        if (!dotRef) return;
        gsap.to(dotRef, { scale: 1, duration: 0.3 });
        gsap.to(cursorRef, { scale: 1, duration: 0.2 });
    };

    window.addEventListener("mousedown", mouseDownHandler);
    window.addEventListener("mouseup", mouseUpHandler);

    const enterHandler = (e) => {
        const directTarget = e.target;

        const allTargets = [];
        let current = directTarget;
        while (current && current !== document.body) {
            if (current.matches(targetSelector)) {
                allTargets.push(current);
            }
            current = current.parentElement;
        }

        const target = allTargets[0] || null;
        if (!target || !cursorRef || !cornersRef) return;

        if (activeTarget === target) return;

        if (activeTarget) {
            cleanupTarget(activeTarget);
        }

        if (resumeTimeout) {
            clearTimeout(resumeTimeout);
            resumeTimeout = null;
        }

        activeTarget = target;
        const corners = Array.from(cornersRef);
        corners.forEach(corner => {
            gsap.killTweensOf(corner);
        });

        gsap.killTweensOf(cursorRef, "rotation");
        spinTl?.pause();

        gsap.set(cursorRef, { rotation: 0 });

        const updateCorners = (mouseX, mouseY) => {
            const rect = target.getBoundingClientRect();
            const cursorRect = cursorRef.getBoundingClientRect();

            const cursorCenterX = cursorRect.left + cursorRect.width / 2;
            const cursorCenterY = cursorRect.top + cursorRect.height / 2;

            const [tlc, trc, brc, blc] = Array.from(cornersRef);

            const { borderWidth, cornerSize, parallaxStrength } = constants;

            let tlOffset = {
                x: rect.left - cursorCenterX - borderWidth,
                y: rect.top - cursorCenterY - borderWidth,
            };
            let trOffset = {
                x: rect.right - cursorCenterX + borderWidth - cornerSize,
                y: rect.top - cursorCenterY - borderWidth,
            };
            let brOffset = {
                x: rect.right - cursorCenterX + borderWidth - cornerSize,
                y: rect.bottom - cursorCenterY + borderWidth - cornerSize,
            };
            let blOffset = {
                x: rect.left - cursorCenterX - borderWidth,
                y: rect.bottom - cursorCenterY + borderWidth - cornerSize,
            };

            if (mouseX !== undefined && mouseY !== undefined) {
                const targetCenterX = rect.left + rect.width / 2;
                const targetCenterY = rect.top + rect.height / 2;
                const mouseOffsetX = (mouseX - targetCenterX) * parallaxStrength;
                const mouseOffsetY = (mouseY - targetCenterY) * parallaxStrength;

                tlOffset.x += mouseOffsetX;
                tlOffset.y += mouseOffsetY;
                trOffset.x += mouseOffsetX;
                trOffset.y += mouseOffsetY;
                brOffset.x += mouseOffsetX;
                brOffset.y += mouseOffsetY;
                blOffset.x += mouseOffsetX;
                blOffset.y += mouseOffsetY;
            }

            const tl = gsap.timeline();
            const corners = [tlc, trc, brc, blc];
            const offsets = [tlOffset, trOffset, brOffset, blOffset];

            corners.forEach((corner, index) => {
                tl.to(
                    corner,
                    {
                        x: offsets[index].x,
                        y: offsets[index].y,
                        duration: 0.2,
                        ease: "power2.out",
                    },
                    0
                );
            });
        };

        isAnimatingToTarget = true;
        updateCorners();

        setTimeout(() => {
            isAnimatingToTarget = false;
        }, 1);

        let moveThrottle = null;
        const targetMove = (ev) => {
            if (moveThrottle || isAnimatingToTarget) return;
            moveThrottle = requestAnimationFrame(() => {
                const mouseEvent = ev;
                updateCorners(mouseEvent.clientX, mouseEvent.clientY);
                moveThrottle = null;
            });
        };

        const leaveHandler = () => {
            activeTarget = null;
            isAnimatingToTarget = false;

            if (cornersRef) {
                const corners = Array.from(cornersRef);
                gsap.killTweensOf(corners);

                const { cornerSize } = constants;
                const positions = [
                    { x: -cornerSize * 1.5, y: -cornerSize * 1.5 },
                    { x: cornerSize * 0.5, y: -cornerSize * 1.5 },
                    { x: cornerSize * 0.5, y: cornerSize * 0.5 },
                    { x: -cornerSize * 1.5, y: cornerSize * 0.5 },
                ];

                const tl = gsap.timeline();
                corners.forEach((corner, index) => {
                    tl.to(
                        corner,
                        {
                            x: positions[index].x,
                            y: positions[index].y,
                            duration: 0.3,
                            ease: "power3.out",
                        },
                        0
                    );
                });
            }

            resumeTimeout = setTimeout(() => {
                if (!activeTarget && cursorRef && spinTl) {
                    const currentRotation = gsap.getProperty(cursorRef, "rotation");
                    const normalizedRotation = currentRotation % 360;

                    spinTl.kill();
                    spinTl = gsap
                        .timeline({ repeat: -1 })
                        .to(cursorRef, { rotation: "+=360", duration: spinDuration, ease: "none" });

                    gsap.to(cursorRef, {
                        rotation: normalizedRotation + 360,
                        duration: spinDuration * (1 - normalizedRotation / 360),
                        ease: "none",
                        onComplete: () => {
                            spinTl?.restart();
                        },
                    });
                }
                resumeTimeout = null;
            }, 50);

            cleanupTarget(target);
        };

        currentTargetMove = targetMove;
        currentLeaveHandler = leaveHandler;

        target.addEventListener("mousemove", targetMove);
        target.addEventListener("mouseleave", leaveHandler);
    };

    window.addEventListener("mouseover", enterHandler, { passive: true });

    // Cleanup function
    window.addEventListener('beforeunload', () => {
        window.removeEventListener("mousemove", moveHandler);
        window.removeEventListener("mouseover", enterHandler);
        window.removeEventListener("scroll", scrollHandler);
        window.removeEventListener("mousedown", mouseDownHandler);
        window.removeEventListener("mouseup", mouseUpHandler);

        if (activeTarget) {
            cleanupTarget(activeTarget);
        }

        spinTl?.kill();
        document.body.style.cursor = originalCursor;
        document.body.classList.remove('cursor-hidden');
    });
});

// Анимированный фон с Three.js
class AnimatedBackground {
    constructor() {
        this.container = document.getElementById('animated-background');
        if (!this.container) return;

        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: true,
            preserveDrawingBuffer: true 
        });
        
        this.mouse = new THREE.Vector2();
        this.clock = new THREE.Clock();
        
        this.init();
        this.animate();
    }

    init() {
        // Настройка рендерера
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.container.appendChild(this.renderer.domElement);

        // Создание геометрии
        const geometry = new THREE.PlaneGeometry(2, 2);

        // Шейдеры
        const vertexShader = `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;

        const fragmentShader = `
            precision highp float;
            uniform vec2 resolution;
            uniform float time;
            uniform float waveSpeed;
            uniform float waveFrequency;
            uniform float waveAmplitude;
            uniform vec3 waveColor;
            uniform vec2 mousePos;
            uniform int enableMouseInteraction;
            uniform float mouseRadius;
            varying vec2 vUv;

            vec4 mod289(vec4 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
            vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
            vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
            vec2 fade(vec2 t) { return t*t*t*(t*(t*6.0-15.0)+10.0); }

            float cnoise(vec2 P) {
                vec4 Pi = floor(P.xyxy) + vec4(0.0,0.0,1.0,1.0);
                vec4 Pf = fract(P.xyxy) - vec4(0.0,0.0,1.0,1.0);
                Pi = mod289(Pi);
                vec4 ix = Pi.xzxz;
                vec4 iy = Pi.yyww;
                vec4 fx = Pf.xzxz;
                vec4 fy = Pf.yyww;
                vec4 i = permute(permute(ix) + iy);
                vec4 gx = fract(i * (1.0/41.0)) * 2.0 - 1.0;
                vec4 gy = abs(gx) - 0.5;
                vec4 tx = floor(gx + 0.5);
                gx = gx - tx;
                vec2 g00 = vec2(gx.x, gy.x);
                vec2 g10 = vec2(gx.y, gy.y);
                vec2 g01 = vec2(gx.z, gy.z);
                vec2 g11 = vec2(gx.w, gy.w);
                vec4 norm = taylorInvSqrt(vec4(dot(g00,g00), dot(g01,g01), dot(g10,g10), dot(g11,g11)));
                g00 *= norm.x; g01 *= norm.y; g10 *= norm.z; g11 *= norm.w;
                float n00 = dot(g00, vec2(fx.x, fy.x));
                float n10 = dot(g10, vec2(fx.y, fy.y));
                float n01 = dot(g01, vec2(fx.z, fy.z));
                float n11 = dot(g11, vec2(fx.w, fy.w));
                vec2 fade_xy = fade(Pf.xy);
                vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
                return 2.3 * mix(n_x.x, n_x.y, fade_xy.y);
            }

            const int OCTAVES = 4;
            float fbm(vec2 p) {
                float value = 0.0;
                float amp = 1.0;
                float freq = waveFrequency;
                for (int i = 0; i < OCTAVES; i++) {
                    value += amp * abs(cnoise(p));
                    p *= freq;
                    amp *= waveAmplitude;
                }
                return value;
            }

            float pattern(vec2 p) {
                vec2 p2 = p - time * waveSpeed;
                return fbm(p + fbm(p2)); 
            }

            void main() {
                vec2 uv = gl_FragCoord.xy / resolution.xy;
                uv -= 0.5;
                uv.x *= resolution.x / resolution.y;
                float f = pattern(uv);
                
                if (enableMouseInteraction == 1) {
                    vec2 mouseNDC = (mousePos / resolution - 0.5) * vec2(1.0, -1.0);
                    mouseNDC.x *= resolution.x / resolution.y;
                    float dist = length(uv - mouseNDC);
                    float effect = 1.0 - smoothstep(0.0, mouseRadius, dist);
                    f -= 0.5 * effect;
                }
                
                vec3 col = mix(vec3(0.0), waveColor, f);
                
                // Дизеринг эффект
                float colorNum = 4.0;
                float step = 1.0 / (colorNum - 1.0);
                col += step * 0.5 * (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5);
                col = floor(col * (colorNum - 1.0) + 0.5) / (colorNum - 1.0);
                
                gl_FragColor = vec4(col, 0.8);
            }
        `;

        // Создание материала
        this.material = new THREE.ShaderMaterial({
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            uniforms: {
                resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
                time: { value: 0 },
                waveSpeed: { value: 0.05 },
                waveFrequency: { value: 3.0 },
                waveAmplitude: { value: 0.3 },
                waveColor: { value: new THREE.Color(0.2, 0.3, 0.5) }, // Синий цвет
                mousePos: { value: new THREE.Vector2(0, 0) },
                enableMouseInteraction: { value: 1 },
                mouseRadius: { value: 0.3 }
            },
            transparent: true
        });

        // Создание меша
        this.mesh = new THREE.Mesh(geometry, this.material);
        this.scene.add(this.mesh);

        // Обработчики событий
        window.addEventListener('resize', () => this.onWindowResize());
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.material.uniforms.resolution.value.set(window.innerWidth, window.innerHeight);
    }

    onMouseMove(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        this.material.uniforms.mousePos.value.set(event.clientX, event.clientY);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        const elapsedTime = this.clock.getElapsedTime();
        this.material.uniforms.time.value = elapsedTime;
        
        this.renderer.render(this.scene, this.camera);
    }
}

// Инициализация анимированного фона
document.addEventListener('DOMContentLoaded', () => {
    new AnimatedBackground();
});
