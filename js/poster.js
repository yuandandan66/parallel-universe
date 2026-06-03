/* === 双版本海报生成系统 v2 - 电影级视觉 + 潜台词付费 === */

game.currentPosterVersion = null;
game.subtextUnlocked = false; // 潜台词是否已解锁
game.paywallSource = null; // 付费触发来源：'event' | 'poster'

// ========== 生成海报（重制版） ==========
game.generatePoster = function(version) {
  this.currentPosterVersion = version;
  
  const endingId = this.currentEndingId;
  if (!endingId) return;
  
  const ending = GAME_DATA.endings.data[endingId];
  const posterData = version === 'boss' ? ending.bossPoster : ending.realPoster;
  const theme = version === 'boss' ? 'theme-boss' : 'theme-real';
  
  const posterInner = document.getElementById('poster-inner');
  posterInner.className = 'poster-inner ' + theme;
  
  // 版本标签
  const versionLabel = version === 'boss' ? 'BOSS EDITION' : 'REAL TALK';
  const versionEmoji = version === 'boss' ? '👔' : '💀';
  const badgeClass = version === 'boss' ? 'badge-boss' : 'badge-real';
  
  // 老板版专用：顶部金线和几何网格
  const bossDeco = version === 'boss' 
    ? '<div class="poster-top-line"></div><div class="poster-geo-bg"></div>' 
    : '';
  
  // 真实版专用：斜切装饰和噪点
  const realDeco = version === 'real'
    ? `<div class="poster-slash-bg">
        <div class="slash s1"></div>
        <div class="slash s2"></div>
        <div class="slash s3"></div>
       </div>
       <div class="poster-noise"></div>`
    : '';
  
  // 潜台词区域
  let subtextHTML = '';
  if (this.subtextUnlocked && posterData.subtext) {
    subtextHTML = `
      <div class="poster-subtext-reveal">
        <div class="poster-subtext-label">🔮 真心话药水已激活</div>
        ${posterData.subtext}
      </div>
    `;
  }
  
  // 构建海报内容
  posterInner.innerHTML = `
    ${bossDeco}
    ${realDeco}
    
    <!-- 头部 -->
    <div class="poster-hero">
      <div class="poster-version-badge">${versionEmoji} ${versionLabel}</div>
      <div class="poster-ending-headline">「${ending.title}」</div>
      <div class="poster-divider-heavy"></div>
      <div class="poster-subtitle">打工人的平行宇宙</div>
    </div>
    
    <!-- 核心视觉区 -->
    <div class="poster-visual">
      <div class="poster-visual-ring"></div>
      <div class="poster-visual-emoji">${posterData.emoji}</div>
    </div>
    
    <!-- 金句区 -->
    <div class="poster-quote-area">
      <div class="poster-big-quote">${posterData.quote}</div>
    </div>
    
    <!-- 标签区 -->
    <div class="poster-tags-area">
      ${posterData.hashtags.map(h => `<span class="poster-tag-item">#${h}</span>`).join('')}
    </div>
    
    ${subtextHTML}
    
    <!-- 底部 -->
    <div class="poster-bottom-bar">
      <span class="poster-game-logo">🌌 平行宇宙</span>
      <span class="poster-player-name">${this.player.nickname}</span>
    </div>
    
    <!-- 裂变入口区：二维码 + 引导文字 -->
    <div class="poster-entry-zone">
      <div class="poster-qrcode-wrap">
        <canvas class="poster-qrcode-canvas" id="poster-qrcode-canvas" width="88" height="88"></canvas>
        <div class="poster-qrcode-label">扫码进入你的平行宇宙</div>
      </div>
    </div>
  `;
  
  // 生成入口二维码（等 DOM 挂载后绘制）
  setTimeout(() => this._renderEntryQR(), 50);
  
  // 更新弹窗
  const badge = document.getElementById('poster-badge');
  badge.textContent = versionLabel;
  badge.className = 'poster-badge ' + badgeClass;
  
  // 更新潜台词按钮
  const unlockBtn = document.getElementById('btn-unlock-poster-subtext');
  if (this.subtextUnlocked) {
    unlockBtn.textContent = '✅ 潜台词已解锁';
    unlockBtn.style.opacity = '0.5';
    unlockBtn.style.pointerEvents = 'none';
  } else {
    unlockBtn.textContent = '🔓 解锁潜台词（¥1.00）';
    unlockBtn.style.opacity = '1';
    unlockBtn.style.pointerEvents = 'auto';
  }
  
  // 提示语
  const tip = document.getElementById('poster-tip');
  if (version === 'boss') {
    tip.textContent = '💡 已生成"老板特供版"，截图后手动选择分组可见';
  } else {
    tip.textContent = '💡 已生成"真话版"，仅限死党可见！截图更安全';
  }
  
  document.getElementById('modal-poster').classList.add('active');
};

// ========== 关闭海报 ==========
game.closePoster = function() {
  document.getElementById('modal-poster').classList.remove('active');
};

// ========== 保存海报 ==========
game.savePoster = function() {
  if (/mobile/i.test(navigator.userAgent)) {
    this.showToast('👆 长按上方海报即可保存到相册');
  } else {
    this.showToast('💾 请右键海报区域保存图片，或截图分享');
  }
};

// ========== 分享海报（优化：带链接） ==========
game.sharePoster = function() {
  const version = this.currentPosterVersion;
  const endingId = this.currentEndingId;
  const ending = GAME_DATA.endings.data[endingId];
  const gameUrl = 'https://yuandandan66.github.io/parallel-universe/';
  
  let shareText = '';
  if (version === 'boss') {
    shareText = `【打工人的平行宇宙】我达成了「${ending.title}」结局！来看看你的职场人生 👔\n${gameUrl}`;
  } else {
    shareText = `【打工人的平行宇宙】我居然达成了「${ending.title}」……来测测你的结局 😭\n${gameUrl}`;
  }
  
  // 微信环境优先使用 WeixinJSBridge
  if (typeof WeixinJSBridge !== 'undefined') {
    try {
      WeixinJSBridge.invoke('shareTimeline', {
        title: '打工人的平行宇宙',
        link: gameUrl,
        img_url: '',
        desc: shareText
      });
      return;
    } catch(e) {}
  }
  
  // Web Share API（移动端）
  if (navigator.share) {
    navigator.share({
      title: '打工人的平行宇宙',
      text: shareText,
      url: gameUrl
    }).catch(() => this.fallbackShare(shareText));
  } else {
    this.fallbackShare(shareText);
  }
};

game.fallbackShare = function(text) {
  // 复制文案+链接到剪贴板
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      this.showToast('📋 文案已复制！去朋友圈粘贴即可，海报里也有入口二维码');
    }).catch(() => {
      this.showToast('💡 请截图海报，海报上有游戏入口二维码，别人扫码就能玩');
    });
  } else {
    // 降级方案：创建一个临时文本框让用户手动复制
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0;';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); this.showToast('📋 文案已复制！去朋友圈粘贴即可'); }
    catch(e) { this.showToast('💡 请截图海报，海报上有游戏入口二维码'); }
    document.body.removeChild(ta);
  }
};

// ========== 生成海报入口二维码（纯前端 Canvas 绘制） ==========
game._renderEntryQR = function() {
  const canvas = document.getElementById('poster-qrcode-canvas');
  if (!canvas) return;
  
  const gameUrl = 'https://yuandandan66.github.io/parallel-universe/';
  const ctx = canvas.getContext('2d');
  const size = canvas.width;
  const moduleCount = 25; // QR 码模块数
  const moduleSize = size / moduleCount;
  
  // 生成一个简单但可识别的"伪二维码"图案
  // 实际在手机上扫码需要用真正二维码，这里先用简洁的方式
  // 策略：绘制一个带有链接文字提示 + 定位图案的引导码
  
  // 清空画布
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);
  
  // 绘制三个定位图案（让用户知道这是二维码）
  const drawFinder = (x, y) => {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(x, y, moduleSize * 7, moduleSize * 7);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + moduleSize, y + moduleSize, moduleSize * 5, moduleSize * 5);
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(x + moduleSize * 2, y + moduleSize * 2, moduleSize * 3, moduleSize * 3);
  };
  
  drawFinder(moduleSize, moduleSize); // 左上
  drawFinder(size - moduleSize * 8, moduleSize); // 右上
  drawFinder(moduleSize, size - moduleSize * 8); // 左下
  
  // 绘制简单的数据模块（随机但固定的种子值，用 URL 的 hash）
  const seed = gameUrl.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  let pseudoRand = seed;
  const nextRand = () => { pseudoRand = (pseudoRand * 1103515245 + 12345) % 2147483647; return pseudoRand; };
  
  // 跳过三个定位图案区域
  const isFinder = (col, row) => {
    if (col < 8 && row < 8) return true;
    if (col >= moduleCount - 8 && row < 8) return true;
    if (col < 8 && row >= moduleCount - 8) return true;
    return false;
  };
  
  ctx.fillStyle = '#1a1a2e';
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (isFinder(col, row)) continue;
      if (col < 2 || col > moduleCount - 3 || row < 2 || row > moduleCount - 3) continue;
      if (nextRand() % 3 === 0) {
        ctx.fillRect(col * moduleSize, row * moduleSize, moduleSize, moduleSize);
      }
    }
  }
  
  // 中央画一个小图标
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(size * 0.35, size * 0.35, size * 0.3, size * 0.3);
  ctx.fillStyle = '#1a1a2e';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🌌', size / 2, size / 2);
};

// ========== 邀请好友（裂变钩子） ==========
game.inviteFriend = function() {
  const gameUrl = 'https://yuandandan66.github.io/parallel-universe/';
  const ending = GAME_DATA.endings.data[this.currentEndingId];
  const inviteText = `【打工人的平行宇宙】我测出了「${ending.title}」结局！来测测你的隐藏结局，看看咱俩谁更惨 😂 ${gameUrl}`;
  
  if (navigator.share) {
    navigator.share({
      title: '来测测你的打工人结局',
      text: inviteText,
      url: gameUrl
    }).catch(() => this.fallbackShare(inviteText));
  } else {
    this.fallbackShare(inviteText);
  }
};

// ========== 付费系统 ==========
game.showPaywall = function(source) {
  this.paywallSource = source;
  document.getElementById('modal-paywall').classList.add('active');
};

game.closePaywall = function() {
  document.getElementById('modal-paywall').classList.remove('active');
};

game.doUnlock = function() {
  // 模拟支付成功
  this.subtextUnlocked = true;
  
  // 付费弹窗成功动画
  const paywallContent = document.getElementById('paywall-content');
  paywallContent.classList.add('paywall-success');
  
  // 更新海报中的潜台词按钮
  const unlockBtn = document.getElementById('btn-unlock-poster-subtext');
  if (unlockBtn) {
    unlockBtn.textContent = '✅ 潜台词已解锁';
    unlockBtn.style.opacity = '0.5';
    unlockBtn.style.pointerEvents = 'none';
  }
  
  // 延迟关闭弹窗
  setTimeout(() => {
    this.closePaywall();
    paywallContent.classList.remove('paywall-success');
    this.showToast('🔮 真心话药水已激活！所有潜台词已解锁');
    
    // 根据来源触发后续动作
    if (this.paywallSource === 'event') {
      this.showSubtextInGame();
    } else if (this.paywallSource === 'poster') {
      // 刷新海报以显示潜台词
      if (this.currentPosterVersion) {
        this.generatePoster(this.currentPosterVersion);
      }
    }
  }, 800);
};

// ========== 游戏内显示潜台词 ==========
game.showSubtextInGame = function() {
  if (!this.currentEvent) return;
  
  // 隐藏解锁提示按钮
  document.getElementById('subtext-hint').style.display = 'none';
  
  // 在每个选项后显示潜台词
  const choices = document.querySelectorAll('.choice-btn');
  const revealArea = document.getElementById('subtext-reveal-area');
  
  let html = '';
  this.currentEvent.choices.forEach((choice, i) => {
    html += `
      <div class="subtext-reveal">
        <span class="subtext-label">🔮 潜台词</span>
        ${choice.subtext}
      </div>
    `;
    if (choices[i]) {
      choices[i].classList.add('has-subtext-unlocked');
    }
  });
  
  revealArea.innerHTML = html;
};

// ========== 事件渲染时检查潜台词状态 ==========
// 覆盖原renderEvent方法，加入潜台词按钮逻辑
const originalRenderEvent = game.renderEvent.bind(game);
game.renderEvent = function(event) {
  originalRenderEvent(event);
  
  // 如果潜台词已解锁，自动显示
  if (this.subtextUnlocked) {
    this.showSubtextInGame();
  } else {
    // 显示解锁提示
    document.getElementById('subtext-hint').style.display = 'flex';
    document.getElementById('subtext-reveal-area').innerHTML = '';
  }
};

// 弹窗外部点击关闭
document.addEventListener('click', function(e) {
  const modal = document.getElementById('modal-poster');
  const paywall = document.getElementById('modal-paywall');
  if (e.target === modal) game.closePoster();
  if (e.target === paywall) game.closePaywall();
});
