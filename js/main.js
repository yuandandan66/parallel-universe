/* === 游戏入口 & 初始化 === */

(function() {
  'use strict';
  
  // 页面加载完成后初始化
  document.addEventListener('DOMContentLoaded', function() {
    game.initSplash();
    
    // 监听昵称输入
    const nicknameInput = document.getElementById('input-nickname');
    if (nicknameInput) {
      nicknameInput.addEventListener('input', function() {
        game.checkStartReady();
      });
    }
    
    // 键盘事件：回车开始游戏
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        const createScreen = document.getElementById('screen-create');
        if (createScreen && createScreen.classList.contains('active')) {
          if (!document.getElementById('btn-start-game').disabled) {
            game.startGame();
          }
        }
      }
    });
    
    console.log('🌌 打工人的平行宇宙 - 已就绪');
    console.log('🎭 薛定谔的朋友圈系统已加载');
    console.log('💡 选择你的面具，开始你的平行宇宙之旅吧！');
  });
  
})();
