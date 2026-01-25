// Alpha Zone 网站交互脚本
document.addEventListener('DOMContentLoaded', function() {
    
    // 状态指示器动画增强
    const statusDot = document.querySelector('.status-dot');
    if (statusDot) {
        setInterval(() => {
            statusDot.style.boxShadow = '0 0 10px #ff4444';
            setTimeout(() => {
                statusDot.style.boxShadow = 'none';
            }, 500);
        }, 2000);
    }

    // 滚动视差效果
    function handleParallax() {
        const scrolled = window.pageYOffset;
        const header = document.querySelector('.header');
        if (header) {
            header.style.transform = `translateY(${scrolled * 0.5}px)`;
        }
    }

    // 滚动触发动画
    function handleScrollAnimations() {
        const elements = document.querySelectorAll('.org-card, .timeline-item, .status-card');
        
        elements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const elementVisible = 150;
            
            if (elementTop < window.innerHeight - elementVisible) {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }
        });
    }


    // 时间线动画
    function animateTimeline() {
        const timelineItems = document.querySelectorAll('.timeline-item');
        
        timelineItems.forEach((item, index) => {
            setTimeout(() => {
                item.style.opacity = '1';
                item.style.transform = 'translateX(0)';
            }, index * 200);
        });
    }

    // 打字机效果
    function typewriterEffect(element, text, speed = 50) {
        let i = 0;
        element.innerHTML = '';
        
        function typeWriter() {
            if (i < text.length) {
                element.innerHTML += text.charAt(i);
                i++;
                setTimeout(typeWriter, speed);
            }
        }
        
        typeWriter();
    }

    // 动态背景效果
    function createDynamicBackground() {
        const header = document.querySelector('.header');
        if (!header) return;
        
        // 创建动态粒子效果
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.style.position = 'absolute';
            particle.style.width = '2px';
            particle.style.height = '2px';
            particle.style.background = 'rgba(255, 107, 53, 0.6)';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = Math.random() * 100 + '%';
            particle.style.animation = `float ${3 + Math.random() * 4}s infinite ease-in-out`;
            particle.style.animationDelay = Math.random() * 2 + 's';
            header.appendChild(particle);
        }
    }

    // 键盘导航支持
    function addKeyboardNavigation() {
        document.addEventListener('keydown', function(e) {
            const sections = document.querySelectorAll('section');
            const currentSection = Array.from(sections).findIndex(section => {
                const rect = section.getBoundingClientRect();
                return rect.top <= window.innerHeight / 2 && rect.bottom >= window.innerHeight / 2;
            });
            
            if (e.key === 'ArrowDown' && currentSection < sections.length - 1) {
                sections[currentSection + 1].scrollIntoView({ behavior: 'smooth' });
            } else if (e.key === 'ArrowUp' && currentSection > 0) {
                sections[currentSection - 1].scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    // 性能监控
    function monitorPerformance() {
        let lastScrollTime = 0;
        
        window.addEventListener('scroll', function() {
            const now = Date.now();
            if (now - lastScrollTime > 16) { // 限制到60fps
                handleParallax();
                handleScrollAnimations();
                lastScrollTime = now;
            }
        });
    }

    // 添加CSS动画关键帧
    function addCustomKeyframes() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes float {
                0%, 100% { transform: translateY(0px) rotate(0deg); }
                25% { transform: translateY(-10px) rotate(90deg); }
                50% { transform: translateY(-5px) rotate(180deg); }
                75% { transform: translateY(-15px) rotate(270deg); }
            }
            
            @keyframes scanline {
                0% { transform: translateY(-100%); }
                100% { transform: translateY(100vh); }
            }
            
            .org-card, .timeline-item, .status-card {
                opacity: 0;
                transform: translateY(30px);
                transition: all 0.6s ease-out;
            }
            
            .timeline-item {
                transform: translateX(-30px);
            }
        `;
        document.head.appendChild(style);
    }

    // 错误处理
    function handleErrors() {
        window.addEventListener('error', function(e) {
            console.warn('Alpha Zone 网站错误:', e.message);
        });
        
        window.addEventListener('unhandledrejection', function(e) {
            console.warn('Alpha Zone 未处理的Promise拒绝:', e.reason);
        });
    }

    // 音乐播放器控制
    function initMusicPlayer() {
        const audio = document.getElementById('background-music');
        const playPauseBtn = document.getElementById('play-pause-btn');
        const volumeSlider = document.getElementById('volume-slider');
        const muteBtn = document.getElementById('mute-btn');
        
        if (!audio) return;
        
        // 设置初始音量
        audio.volume = volumeSlider.value;
        
        // 尝试自动播放（可能会被浏览器阻止）
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                // 自动播放成功
                playPauseBtn.classList.add('playing');
            }).catch(error => {
                // 自动播放失败，等待用户交互
                console.log('自动播放被阻止，等待用户交互');
                playPauseBtn.classList.remove('playing');
            });
        }
        
        // 播放/暂停按钮点击事件
        playPauseBtn.addEventListener('click', function() {
            if (audio.paused) {
                audio.play();
                this.classList.add('playing');
            } else {
                audio.pause();
                this.classList.remove('playing');
            }
        });
        
        // 音量滑块事件
        volumeSlider.addEventListener('input', function() {
            audio.volume = this.value;
            // 更新静音按钮状态
            if (audio.volume > 0) {
                muteBtn.textContent = '静音';
            }
        });
        
        // 静音按钮事件
        muteBtn.addEventListener('click', function() {
            if (audio.volume > 0) {
                audio.dataset.lastVolume = audio.volume;
                audio.volume = 0;
                volumeSlider.value = 0;
                this.textContent = '取消静音';
            } else {
                const lastVolume = audio.dataset.lastVolume || 0.5;
                audio.volume = lastVolume;
                volumeSlider.value = lastVolume;
                this.textContent = '静音';
            }
        });
        
        // 音频播放状态更新
        audio.addEventListener('play', function() {
            playPauseBtn.classList.add('playing');
        });
        
        audio.addEventListener('pause', function() {
            playPauseBtn.classList.remove('playing');
        });
        
        // 页面可见性改变时处理音频
        document.addEventListener('visibilitychange', function() {
            if (document.visibilityState === 'hidden') {
                // 页面隐藏时暂停音频
                if (!audio.paused) {
                    audio.dataset.wasPlaying = 'true';
                    audio.pause();
                }
            } else if (document.visibilityState === 'visible') {
                // 页面重新可见时恢复播放
                if (audio.dataset.wasPlaying === 'true') {
                    audio.play();
                    delete audio.dataset.wasPlaying;
                }
            }
        });
    }

    // 初始化所有功能
    function initialize() {
        addCustomKeyframes();
        createDynamicBackground();
        animateTimeline();
        addKeyboardNavigation();
        monitorPerformance();
        handleErrors();
        initMusicPlayer();
        
        // 初始滚动检查
        handleScrollAnimations();
        
        console.log('Alpha Zone 系统初始化完成');
    }

    // 页面加载完成后初始化
    initialize();

    // 窗口大小改变时重新计算
    window.addEventListener('resize', function() {
        handleScrollAnimations();
    });

    // 页面可见性改变时的处理
    document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'visible') {
            // 页面重新可见时重新启动动画
            animateTimeline();
        }
    });

    // 添加控制台彩蛋
    console.log(`
    ╔══════════════════════════════════════════════════════════════╗
    ║                    ALPHA ZONE 系统日志                       ║
    ║                                                              ║
    ║  状态: 黑域活跃                                             ║
    ║  保密等级: L3                                               ║
    ║  警告: 进入ALPHA ZONE = 放弃《日内瓦公约》保护               ║
    ║                                                              ║
    ║  "开火优先于说话，沉默优先于呼救"                           ║
    ╚══════════════════════════════════════════════════════════════╝
    `);

});