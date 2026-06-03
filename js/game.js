/* === 游戏核心逻辑 === */

class ParallelUniverse {
  constructor() {
    this.player = {
      avatar: null,
      nickname: '',
      energy: 100,
      anger: 0,
      money: 5000,
      days: 1,
      tags: [],
      eventHistory: []
    };
    
    this.currentEvent = null;
    this.eventsPool = [...GAME_DATA.events];
    this.maxDays = 7; // 7天后触发结局
    this.gameActive = false;
    this.eventIndex = 0;
    this.processedEvents = 0;
  }

  // ========== 场景切换 ==========
  switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(screenId);
    if (target) target.classList.add('active');
  }

  // ========== 开场动画 ==========
  initSplash() {
    // 生成星空
    const starsContainer = document.getElementById('splash-stars');
    for (let i = 0; i < 60; i++) {
      const star = document.createElement('div');
      star.className = 'star';
      star.style.left = Math.random() * 100 + '%';
      star.style.top = Math.random() * 100 + '%';
      star.style.width = star.style.height = (Math.random() * 3 + 1) + 'px';
      star.style.setProperty('--dur', (Math.random() * 3 + 2) + 's');
      star.style.setProperty('--delay', Math.random() * 3 + 's');
      starsContainer.appendChild(star);
    }
  }

  // ========== 开始游戏流程 ==========
  start() {
    this.switchScreen('screen-create');
  }

  goToSplash() {
    this.switchScreen('screen-splash');
  }

  selectAvatar(el) {
    document.querySelectorAll('.avatar-option').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
    this.player.avatar = el.dataset.avatar;
    this.checkStartReady();
  }

  checkStartReady() {
    const btn = document.getElementById('btn-start-game');
    btn.disabled = !this.player.avatar;
  }

  startGame() {
    if (!this.player.avatar) return;
    
    // 设置昵称
    const nicknameInput = document.getElementById('input-nickname');
    this.player.nickname = nicknameInput.value.trim() || '不愿透露姓名的打工人';
    
    // 设置初始标签
    const initTags = GAME_DATA.initialTagsByAvatar[this.player.avatar] || ['职场萌新'];
    this.player.tags = [...initTags];
    
    // 重置状态
    this.player.energy = 100;
    this.player.anger = 0;
    this.player.money = 5000;
    this.player.days = 1;
    this.player.eventHistory = [];
    this.eventsPool = [...GAME_DATA.events];
    this.processedEvents = 0;
    this.gameActive = true;
    
    // 打乱事件顺序
    this.shuffleArray(this.eventsPool);
    
    // 更新UI
    this.updateStatusBars();
    this.updatePersonaTags();
    this.clearLog();
    
    // 切换到游戏画面
    this.switchScreen('screen-game');
    
    // 显示第一个事件
    setTimeout(() => this.showNextEvent(), 500);
  }

  // ========== 状态更新 ==========
  updateStatusBars() {
    const p = this.player;
    document.getElementById('bar-energy').style.width = Math.max(0, Math.min(100, p.energy)) + '%';
    document.getElementById('val-energy').textContent = Math.max(0, p.energy);
    document.getElementById('bar-anger').style.width = Math.max(0, Math.min(100, p.anger)) + '%';
    document.getElementById('val-anger').textContent = p.anger;
    document.getElementById('val-money').textContent = p.money;
    document.getElementById('val-day').textContent = p.days;
  }

  updatePersonaTags() {
    const container = document.getElementById('persona-tags');
    const uniqueTags = [...new Set(this.player.tags)];
    container.innerHTML = uniqueTags.map((tag, i) => {
      let tagClass = 'tag-default';
      if (['卷王', '肝帝', '人生赢家', '效率达人', '谈判高手', '硬气'].includes(tag)) tagClass = 'tag-positive';
      else if (['牛马', '背锅侠', '受气包', '社死现场', '社死边缘'].includes(tag)) tagClass = 'tag-negative';
      else if (['知足常乐', '佛系', '独行侠', '温和派'].includes(tag)) tagClass = 'tag-neutral';
      return `<span class="tag ${tagClass}">${tag}</span>`;
    }).join('');
  }

  addLog(message) {
    const log = document.getElementById('game-log');
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.textContent = '📋 ' + message;
    log.appendChild(entry);
    log.scrollTop = log.scrollHeight;
  }

  clearLog() {
    const log = document.getElementById('game-log');
    log.innerHTML = '<div class="log-entry">📋 第一天上班，你惴惴不安地走进公司大门……</div>';
  }

  // ========== 事件系统 ==========
  showNextEvent() {
    if (!this.gameActive) return;
    
    // 检查是否触发结局
    if (this.processedEvents >= this.maxDays) {
      this.triggerEnding();
      return;
    }
    
    // 如果事件池空了，重新填充
    if (this.eventsPool.length === 0) {
      this.eventsPool = [...GAME_DATA.events];
      this.shuffleArray(this.eventsPool);
    }
    
    // 取出下一个事件
    const event = this.eventsPool.pop();
    this.currentEvent = event;
    this.processedEvents++;
    this.player.days = this.processedEvents + 1;
    
    // 更新日期
    document.getElementById('val-day').textContent = this.player.days;
    
    // 渲染事件卡片
    this.renderEvent(event);
  }

  renderEvent(event) {
    const card = document.getElementById('event-card');
    
    // 重新触发动画
    card.style.animation = 'none';
    card.offsetHeight; // reflow
    card.style.animation = 'cardSlideUp 0.5s ease';
    
    document.getElementById('event-time').textContent = '🕐 ' + event.time;
    document.getElementById('event-scene-emoji').textContent = event.emoji;
    document.getElementById('event-title').textContent = event.title;
    document.getElementById('event-desc').textContent = event.desc;
    
    // 渲染选项
    const choicesContainer = document.getElementById('event-choices');
    choicesContainer.innerHTML = event.choices.map((choice, index) => {
      const icons = ['A', 'B', 'C'];
      return `
        <button class="choice-btn" onclick="game.makeChoice(${index})">
          <span style="color:var(--text-dim);font-weight:700;margin-right:8px;">${icons[index]}.</span>
          ${choice.text}
        </button>
      `;
    }).join('');
  }

  makeChoice(choiceIndex) {
    if (!this.currentEvent) return;
    
    const choice = this.currentEvent.choices[choiceIndex];
    
    // 应用效果
    this.player.energy += choice.effects.energy;
    this.player.anger += choice.effects.anger;
    this.player.money += choice.effects.money;
    
    // 限制范围
    this.player.energy = Math.max(0, Math.min(100, this.player.energy));
    this.player.anger = Math.max(0, Math.min(100, this.player.anger));
    this.player.money = Math.max(0, this.player.money);
    
    // 添加标签
    if (choice.effects.tags) {
      choice.effects.tags.forEach(tag => {
        if (!this.player.tags.includes(tag)) {
          this.player.tags.push(tag);
        }
      });
    }
    
    // 记录事件
    this.player.eventHistory.push({
      event: this.currentEvent.id,
      choice: choiceIndex,
      log: choice.log
    });
    
    // 更新UI
    this.updateStatusBars();
    this.updatePersonaTags();
    this.addLog(choice.log);
    
    // 状态动画
    this.animateStatusChange(choice.effects);
    
    // 显示下一个事件
    setTimeout(() => this.showNextEvent(), 1200);
  }

  animateStatusChange(effects) {
    const items = [
      { id: 'val-energy', val: effects.energy },
      { id: 'val-anger', val: effects.anger },
      { id: 'val-money', val: effects.money }
    ];
    
    items.forEach(item => {
      if (item.val !== 0) {
        const el = document.getElementById(item.id);
        const sign = item.val > 0 ? '+' : '';
        const color = item.val > 0 ? (item.id === 'val-anger' ? '#ff3e3e' : '#00d2ff') : '#ff3e3e';
        el.style.color = color;
        el.style.transform = 'scale(1.3)';
        setTimeout(() => {
          el.style.color = '';
          el.style.transform = '';
        }, 500);
      }
    });
  }

  // ========== 结局系统 ==========
  triggerEnding() {
    this.gameActive = false;
    
    const endingId = GAME_DATA.endings.judge(this.player);
    const ending = GAME_DATA.endings.data[endingId];
    
    document.getElementById('ending-emoji').textContent = ending.emoji;
    document.getElementById('ending-title-text').textContent = ending.title;
    document.getElementById('ending-desc-text').textContent = ending.desc;
    document.getElementById('ending-flavor').textContent = ending.flavor;
    
    // 显示统计
    const stats = document.getElementById('ending-stats');
    stats.innerHTML = `
      <div class="ending-stat">
        <span class="ending-stat-val">${this.player.days}</span>
        <span class="ending-stat-label">打工天数</span>
      </div>
      <div class="ending-stat">
        <span class="ending-stat-val">¥${this.player.money}</span>
        <span class="ending-stat-label">最终余额</span>
      </div>
      <div class="ending-stat">
        <span class="ending-stat-val">${this.player.anger}%</span>
        <span class="ending-stat-label">怨气值</span>
      </div>
    `;
    
    // 存储当前结局ID
    this.currentEndingId = endingId;
    
    this.switchScreen('screen-ending');
    
    // 滚动到分享区域
    setTimeout(() => {
      document.querySelector('.share-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 300);
  }

  // ========== 重新开始 ==========
  replay() {
    this.player = {
      avatar: this.player.avatar,
      nickname: this.player.nickname,
      energy: 100,
      anger: 0,
      money: 5000,
      days: 1,
      tags: [...GAME_DATA.initialTagsByAvatar[this.player.avatar] || ['职场萌新']],
      eventHistory: []
    };
    this.eventsPool = [...GAME_DATA.events];
    this.shuffleArray(this.eventsPool);
    this.processedEvents = 0;
    this.gameActive = true;
    this.currentEvent = null;
    this.currentEndingId = null;
    
    this.updateStatusBars();
    this.updatePersonaTags();
    this.clearLog();
    
    this.switchScreen('screen-game');
    setTimeout(() => this.showNextEvent(), 500);
  }

  // ========== 工具函数 ==========
  shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  // ========== Toast ==========
  showToast(message, duration = 2000) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), duration);
  }
}

// 全局实例
const game = new ParallelUniverse();
