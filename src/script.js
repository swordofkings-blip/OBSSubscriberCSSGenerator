/**
 * @title OBSチャンネル登録者数カスタムCSSジェネレーター ロジック定義 (簡素化リファクタリング版)
 * @description コピペされたCSSセレクタ文字列を分解して親要素を含めた visibility 制御を行い、CSSをリアルタイムに生成します。
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM要素の取得
  const selectorInput = document.getElementById('selectorInput');
  const previewTextInput = document.getElementById('previewTextInput');

  // スタイリング用コントロール
  const fontSizeInput = document.getElementById('fontSize');
  const fontSizeVal = document.getElementById('fontSizeVal');
  const fontWeightInput = document.getElementById('fontWeight');
  
  // 文字色・グラデーション設定
  const colorType = document.getElementById('colorType');
  const solidColorGroup = document.getElementById('solidColorGroup');
  const fontColor = document.getElementById('fontColor');
  const fontColorHex = document.getElementById('fontColorHex');
  
  const gradientControls = document.getElementById('gradientControls');
  const gradientColorStart = document.getElementById('gradientColorStart');
  const gradStartHex = document.getElementById('gradStartHex');
  const gradientColorEnd = document.getElementById('gradientColorEnd');
  const gradEndHex = document.getElementById('gradEndHex');
  const gradientAngleGroup = document.getElementById('gradientAngleGroup');
  const gradientAngle = document.getElementById('gradientAngle');
  const gradientAngleVal = document.getElementById('gradientAngleVal');

  const fontFamilySelect = document.getElementById('fontFamily');
  const customFontInput = document.getElementById('customFont');
  const googleFontsGuide = document.getElementById('googleFontsGuide'); // Google Fonts選択時の説明用ガイド要素

  // 縁取り（袋文字）
  const textStrokeWidth = document.getElementById('textStrokeWidth');
  const textStrokeWidthVal = document.getElementById('textStrokeWidthVal');
  const textStrokeColor = document.getElementById('textStrokeColor');
  const textStrokeColorHex = document.getElementById('textStrokeColorHex');

  // 配置・レイアウト
  const alignSelect = document.getElementById('alignSelect');
  const paddingInput = document.getElementById('padding');
  const paddingVal = document.getElementById('paddingVal');

  // アニメーション
  const animSelect = document.getElementById('animSelect');
  const animMode = document.getElementById('animMode');
  const animSpeed = document.getElementById('animSpeed');
  const animSpeedVal = document.getElementById('animSpeedVal');

  // プレビュー背景タブ
  const bgTabs = document.querySelectorAll('.bg-tab');
  const previewScreen = document.getElementById('previewScreen');
  const previewTarget = document.getElementById('previewTarget');

  // 出力エリア
  const cssOutput = document.getElementById('cssOutput');
  const copyBtn = document.getElementById('copyBtn');

  // プリセット保存・読込用要素
  const slotButtons = document.querySelectorAll('.slot-btn');
  const savePresetBtn = document.getElementById('savePresetBtn');
  const loadPresetBtn = document.getElementById('loadPresetBtn');
  const presetStatus = document.getElementById('presetStatus');
  
  let selectedSlot = null; // 選択中のスロット番号 (1〜5)

  // Google Fonts 動的インポート用スタイルタグ（プレビュー用）
  const fontLoaderStyle = document.createElement('style');
  document.head.appendChild(fontLoaderStyle);
  
  // フォントの再読み込みを制限するためのキャッシュ用変数
  let lastLoadedFont = '';

  // 初期値の同期
  updateValBadges();
  generateCSS();

  // イベントリスナーの登録
  previewTextInput.addEventListener('input', () => {
    previewTarget.textContent = previewTextInput.value;
  });

  // 色タイプの切り替え制御
  colorType.addEventListener('change', () => {
    if (colorType.value === 'solid') {
      solidColorGroup.style.display = 'block';
      gradientControls.style.display = 'none';
      gradientAngleGroup.style.display = 'none';
    } else {
      solidColorGroup.style.display = 'none';
      gradientControls.style.display = 'flex';
      gradientAngleGroup.style.display = 'block';
    }
    updateValBadges();
    generateCSS();
  });

  // カラーピッカー変更時の16進数文字同期
  fontColor.addEventListener('input', () => {
    fontColorHex.textContent = fontColor.value;
    generateCSS();
  });
  gradientColorStart.addEventListener('input', () => {
    gradStartHex.textContent = gradientColorStart.value;
    generateCSS();
  });
  gradientColorEnd.addEventListener('input', () => {
    gradEndHex.textContent = gradientColorEnd.value;
    generateCSS();
  });
  textStrokeColor.addEventListener('input', () => {
    textStrokeColorHex.textContent = textStrokeColor.value;
    generateCSS();
  });

  // カラーインプットコンテナ全体をクリックした際、子要素のカラーピッカーを開く処理
  document.querySelectorAll('.color-input-container').forEach(container => {
    container.addEventListener('click', (e) => {
      if (e.target.tagName !== 'INPUT') {
        const picker = container.querySelector('input[type="color"]');
        if (picker) picker.click();
      }
    });
  });

  // 入力値の変更でCSSを自動更新するコントロール群
  const autoUpdateControls = [
    fontSizeInput, fontWeightInput, fontFamilySelect, selectorInput,
    textStrokeWidth, textStrokeColor, alignSelect, paddingInput, 
    animSelect, animMode, animSpeed, gradientAngle
  ];
  
  autoUpdateControls.forEach(ctrl => {
    ctrl.addEventListener('input', () => {
      updateValBadges();
      generateCSS();
    });
  });

  // 入力された内容がGoogle FontsのURL（specimenを含む）だった場合、即座にフォント名へパースして適用
  // タイピング中の高負荷なフォント読み込みを避けるため、通常入力は change で、URL貼り付け等は input で処理を切り分ける
  customFontInput.addEventListener('input', () => {
    let val = customFontInput.value.trim();
    if (val.includes('fonts.google.com/specimen/')) {
      try {
        // プロトコルが省略されている場合に URL オブジェクトのパースエラーを防ぐため https を明記
        if (!val.startsWith('http://') && !val.startsWith('https://')) {
          val = 'https://' + val;
        }
        const url = new URL(val);
        const pathParts = url.pathname.split('/');
        const specimenIndex = pathParts.indexOf('specimen');
        if (specimenIndex !== -1 && pathParts[specimenIndex + 1]) {
          let fontName = decodeURIComponent(pathParts[specimenIndex + 1]);
          // URL用にエンコードされた + を半角スペースに直して入力欄にセットする
          fontName = fontName.replace(/\+/g, ' ');
          customFontInput.value = fontName;
          
          // 値が置換されたので、即座に外部フォントのロードとCSSの再生成を行う
          updateValBadges();
          generateCSS();
        }
      } catch (e) {
        console.error('Google Fonts URLの解析に失敗しました:', e);
      }
    }
  });

  // カスタムフォント入力欄はタイピング中のラグ防止のため、フォーカスアウト(change)時にのみロードを実行
  customFontInput.addEventListener('change', () => {
    updateValBadges();
    generateCSS();
  });

  // 背景切替タブの制御
  bgTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      bgTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const bgType = tab.dataset.bg;
      previewScreen.className = 'preview-screen'; // クラスのリセット
      if (bgType === 'transparent') {
        previewScreen.classList.add('bg-transparent-pattern');
      } else if (bgType === 'black') {
        previewScreen.classList.add('bg-black');
      } else if (bgType === 'green') {
        previewScreen.classList.add('bg-green');
      } else if (bgType === 'magenta') {
        previewScreen.classList.add('bg-magenta');
      }
    });
  });

  // コピー機能
  copyBtn.addEventListener('click', () => {
    cssOutput.select();
    navigator.clipboard.writeText(cssOutput.value).then(() => {
      const originalText = copyBtn.textContent;
      copyBtn.textContent = 'コピー完了！';
      copyBtn.style.backgroundColor = '#10b981'; // 成功時の緑色
      setTimeout(() => {
        copyBtn.textContent = originalText;
        copyBtn.style.backgroundColor = '';
      }, 2000); // 2秒間一時的に変更して戻す
    }).catch(err => {
      console.error('コピー失敗: ', err);
    });
  });

  // --- プリセット保存・復元機能のロジック ---

  /**
   * @title プリセット保存状況のチェックとプレビュー適用
   * @description 各スロットにセーブデータがあるかを調べ、緑のドットインジケータと、保存されたデザインスタイルのプレビューをボタン文字に適用します。
   */
  function checkPresetStorage() {
    slotButtons.forEach(btn => {
      const slot = btn.dataset.slot;
      const data = localStorage.getItem(`obs_css_preset_${slot}`);
      const previewSpan = btn.querySelector('.slot-preview');
      
      if (!previewSpan) return;

      if (data) {
        btn.classList.add('has-data');
        try {
          const parsed = JSON.parse(data);
          
          // --- プレビュー用スタイルの適用 ---
          
          // 1. フォントの設定
          let family = parsed.fontFamily || 'sans-serif';
          if (family === 'custom') {
            family = parsed.customFont ? `"${parsed.customFont}"` : 'sans-serif';
            // ボタンプレビュー表示用にもGoogle Fontsを動的に読み込む
            if (parsed.customFont) {
              const fontNameForUrl = parsed.customFont.replace(/\s+/g, '+');
              const linkId = `gfont-slot-${slot}`;
              let link = document.getElementById(linkId);
              if (!link) {
                link = document.createElement('link');
                link.id = linkId;
                link.rel = 'stylesheet';
                link.href = `https://fonts.googleapis.com/css2?family=${fontNameForUrl}:wght@400;700;900&display=swap`;
                document.head.appendChild(link);
              }
            }
          }
          previewSpan.style.fontFamily = `${family}, sans-serif`;
          previewSpan.style.fontWeight = parsed.fontWeight || '700';

          // 2. 縁取り幅のスケールダウン計算
          // 18: ボタン枠内に文字（1〜5）がはみ出さずに綺麗に収まるプレビューフォントサイズ (18px)
          const previewFontSize = 18; 
          const originalFontSize = parseFloat(parsed.fontSize) || 48;
          const scale = previewFontSize / originalFontSize;
          const originalStrokeWidth = parseInt(parsed.textStrokeWidth, 10) || 0;
          
          // 縮小された太さを計算（最小0.5px、最大2px程度にクリップして文字潰れを防止）
          let strokeWidth = 0;
          if (originalStrokeWidth > 0) {
            strokeWidth = originalStrokeWidth * scale;
            if (strokeWidth < 0.5) strokeWidth = 0.5;
            if (strokeWidth > 2) strokeWidth = 2;
          }
          const strokeColor = parsed.textStrokeColor || '#000000';

          // 3. 色とグラデーションの設定
          if (parsed.colorType === 'solid') {
            const color = parsed.fontColor || '#ffffff';
            previewSpan.style.color = color;
            previewSpan.style.backgroundImage = 'none';
            previewSpan.style.webkitBackgroundClip = 'unset';
            previewSpan.style.backgroundClip = 'unset';
            previewSpan.style.webkitTextFillColor = 'unset';
            
            // 縮小版 text-shadow の適用（プレビュー用は処理軽減のため4方向で簡略化）
            if (strokeWidth > 0) {
              const wVal = strokeWidth.toFixed(1);
              previewSpan.style.textShadow = `
                ${wVal}px ${wVal}px 0 ${strokeColor},
                -${wVal}px ${wVal}px 0 ${strokeColor},
                ${wVal}px -${wVal}px 0 ${strokeColor},
                -${wVal}px -${wVal}px 0 ${strokeColor}
              `.trim().replace(/\s+/g, ' ');
            } else {
              previewSpan.style.textShadow = 'none';
            }
            previewSpan.style.filter = 'none';
          } else {
            // グラデーションの場合
            const gradStart = parsed.gradientColorStart || '#ec4899';
            const gradEnd = parsed.gradientColorEnd || '#3b82f6';
            const gradAngle = parsed.gradientAngle || '135';
            
            previewSpan.style.color = 'transparent';
            previewSpan.style.backgroundImage = `linear-gradient(${gradAngle}deg, ${gradStart}, ${gradEnd})`;
            previewSpan.style.webkitBackgroundClip = 'text';
            previewSpan.style.backgroundClip = 'text';
            previewSpan.style.webkitTextFillColor = 'transparent';
            previewSpan.style.textShadow = 'none';
            
            // グラデーション時の縁取り（処理軽減と見栄えのため4方向のdrop-shadowで簡略化）
            if (strokeWidth > 0) {
              const shadows = [];
              const steps = 4;
              for (let i = 0; i < steps; i++) {
                const angle = (i * 2 * Math.PI) / steps;
                const x = (Math.cos(angle) * strokeWidth).toFixed(1);
                const y = (Math.sin(angle) * strokeWidth).toFixed(1);
                shadows.push(`drop-shadow(${x}px ${y}px 0px ${strokeColor})`);
              }
              previewSpan.style.filter = shadows.join(' ');
            } else {
              previewSpan.style.filter = 'none';
            }
          }
        } catch (e) {
          console.error(`スロット ${slot} のプレビュー適用に失敗しました:`, e);
        }
      } else {
        btn.classList.remove('has-data');
        // スタイルをデフォルトにリセット
        previewSpan.style.color = '';
        previewSpan.style.fontFamily = '';
        previewSpan.style.fontWeight = '';
        previewSpan.style.backgroundImage = '';
        previewSpan.style.webkitBackgroundClip = '';
        previewSpan.style.backgroundClip = '';
        previewSpan.style.webkitTextFillColor = '';
        previewSpan.style.textShadow = '';
        previewSpan.style.filter = '';
        
        // Google Fontsの動的リンクがあれば削除
        const linkId = `gfont-slot-${slot}`;
        const link = document.getElementById(linkId);
        if (link) link.remove();
      }
    });
  }

  // 起動時に保存状態を確認
  checkPresetStorage();

  // セーブスロット選択の挙動
  slotButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      slotButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedSlot = btn.dataset.slot;

      // 選択したスロットにデータがあるかどうかで読み込みボタンを活性化
      const data = localStorage.getItem(`obs_css_preset_${selectedSlot}`);
      if (data) {
        const parsed = JSON.parse(data);
        const dateStr = parsed.saveTime ? new Date(parsed.saveTime).toLocaleString('ja-JP') : '日時不明';
        presetStatus.textContent = `スロット ${selectedSlot} : 保存データあり (${dateStr})`;
        presetStatus.style.color = '#38bdf8'; // アクティブ青
        loadPresetBtn.disabled = false;
      } else {
        presetStatus.textContent = `スロット ${selectedSlot} : 空のスロット`;
        presetStatus.style.color = 'var(--text-secondary)';
        loadPresetBtn.disabled = true;
      }
    });
  });

  // 現在の設定を保存
  savePresetBtn.addEventListener('click', () => {
    if (!selectedSlot) {
      alert('保存先のスロット番号（1〜5）を選択してください。');
      return;
    }

    const presetData = {
      saveTime: Date.now(),
      selector: selectorInput.value,
      previewText: previewTextInput.value,
      fontSize: fontSizeInput.value,
      fontWeight: fontWeightInput.value,
      colorType: colorType.value,
      fontColor: fontColor.value,
      gradientColorStart: gradientColorStart.value,
      gradientColorEnd: gradientColorEnd.value,
      gradientAngle: gradientAngle.value,
      fontFamily: fontFamilySelect.value,
      customFont: customFontInput.value,
      textStrokeWidth: textStrokeWidth.value,
      textStrokeColor: textStrokeColor.value,
      align: alignSelect.value,
      padding: paddingInput.value,
      animType: animSelect.value,
      animMode: animMode.value,
      animSpeed: animSpeed.value
    };

    localStorage.setItem(`obs_css_preset_${selectedSlot}`, JSON.stringify(presetData));

    // プレビューと緑ドット、およびロードボタンの有効化状態を更新
    checkPresetStorage();
    loadPresetBtn.disabled = false;
    const dateStr = new Date(presetData.saveTime).toLocaleString('ja-JP');
    presetStatus.textContent = `スロット ${selectedSlot} に現在のデザインを保存しました！ (${dateStr})`;
    presetStatus.style.color = '#10b981'; // 成功時の緑色
    
    setTimeout(() => {
      presetStatus.style.color = '#38bdf8';
    }, 2000); // 2秒後に状態表示に戻す
  });

  // 選択中の設定を読み込んでUIに復元
  loadPresetBtn.addEventListener('click', () => {
    if (!selectedSlot) return;

    const data = localStorage.getItem(`obs_css_preset_${selectedSlot}`);
    if (!data) return;

    try {
      const parsed = JSON.parse(data);

      // 各入力欄の値を復元
      selectorInput.value = parsed.selector || '';
      previewTextInput.value = parsed.previewText || '25';
      fontSizeInput.value = parsed.fontSize || '48';
      fontWeightInput.value = parsed.fontWeight || '700';
      colorType.value = parsed.colorType || 'solid';
      fontColor.value = parsed.fontColor || '#ffffff';
      gradientColorStart.value = parsed.gradientColorStart || '#ec4899';
      gradientColorEnd.value = parsed.gradientColorEnd || '#3b82f6';
      gradientAngle.value = parsed.gradientAngle || '135';
      fontFamilySelect.value = parsed.fontFamily || 'sans-serif';
      customFontInput.value = parsed.customFont || '';
      textStrokeWidth.value = parsed.textStrokeWidth || '4';
      textStrokeColor.value = parsed.textStrokeColor || '#000000';
      alignSelect.value = parsed.align || 'center';
      paddingInput.value = parsed.padding || '10';
      animSelect.value = parsed.animType || 'none';
      animMode.value = parsed.animMode || 'infinite';
      animSpeed.value = parsed.animSpeed || '2.0';

      // 16進数カラーテキストの再同期
      fontColorHex.textContent = fontColor.value;
      gradStartHex.textContent = gradientColorStart.value;
      gradEndHex.textContent = gradientColorEnd.value;
      textStrokeColorHex.textContent = textStrokeColor.value;

      // 色設定エリアの表示・非表示切り替え
      if (colorType.value === 'solid') {
        solidColorGroup.style.display = 'block';
        gradientControls.style.display = 'none';
        gradientAngleGroup.style.display = 'none';
      } else {
        solidColorGroup.style.display = 'none';
        gradientControls.style.display = 'flex';
        gradientAngleGroup.style.display = 'block';
      }

      // プレビュー文字の復元
      previewTarget.textContent = previewTextInput.value;

      // スタイルバッジとCSSの再構築
      updateValBadges();
      generateCSS();

      presetStatus.textContent = `スロット ${selectedSlot} からデザインをロードしました！`;
      presetStatus.style.color = '#10b981';
      
      setTimeout(() => {
        const dateStr = new Date(parsed.saveTime).toLocaleString('ja-JP');
        presetStatus.textContent = `スロット ${selectedSlot} : 保存データあり (${dateStr})`;
        presetStatus.style.color = '#38bdf8';
      }, 2000); // 2秒後に状態表示に戻す

    } catch (e) {
      console.error(e);
      alert('プリセットの読み込み中にエラーが発生しました。');
    }
  });

  /**
   * @title 数値インジケータの同期
   * @description スライダーコントロールの値を隣接する数値インジケータテキストに同期します。
   */
  function updateValBadges() {
    fontSizeVal.textContent = `${fontSizeInput.value}px`;
    textStrokeWidthVal.textContent = `${textStrokeWidth.value}px`;
    paddingVal.textContent = `${paddingInput.value}px`;
    animSpeedVal.textContent = `${animSpeed.value}秒`;
    gradientAngleVal.textContent = `${gradientAngle.value}度`;
    
    // カスタムフォント入力エリアおよび説明ガイドの表示/非表示を切り替え
    if (fontFamilySelect.value === 'custom') {
      customFontInput.style.display = 'block';
      if (googleFontsGuide) googleFontsGuide.style.display = 'block'; // Google Fontsからフォント名を取得する手順を明示
    } else {
      customFontInput.style.display = 'none';
      if (googleFontsGuide) googleFontsGuide.style.display = 'none'; // 通常フォント時は不要なため非表示
    }
  }

  /**
   * @title 単色用テキスト縁取り text-shadow の自動生成
   * @description 8方向〜24方向に影を重ねたtext-shadowプロパティの値を生成します（単色文字用）。
   * @param {number} width 縁取り幅(px)
   * @param {string} color 縁取り色
   * @returns {string} CSS text-shadow用のカンマ区切り値
   */
  function generateTextShadow(width, color) {
    if (width === 0) return 'none';
    const shadows = [];
    
    for (let w = 1; w <= width; w++) {
      const steps = w * 8; 
      for (let i = 0; i < steps; i++) {
        const angle = (i * 2 * Math.PI) / steps;
        const x = (Math.cos(angle) * w).toFixed(1);
        const y = (Math.sin(angle) * w).toFixed(1);
        shadows.push(`${x}px ${y}px 0px ${color}`);
      }
    }
    return shadows.join(', ');
  }

  /**
   * @title グラデーション用縁取り filter: drop-shadow の自動生成
   * @description 文字グラデーションが潰れないよう、filterプロパティによる多方向重ねのdrop-shadowを生成します（グラデーション文字用）。
   * @param {number} width 縁取り幅(px)
   * @param {string} color 縁取り色
   * @returns {string} CSS filter用のスペース区切り値
   */
  function generateFilterDropShadow(width, color) {
    if (width === 0) return 'none';
    const shadows = [];
    
    // filter: drop-shadowのレンダリング負荷を抑えるため、最大幅の位置に8方向(45度ステップ)で影を配置する
    const steps = 8; /* 8方向を指定することで綺麗な袋文字のクリアランスを維持 */
    for (let i = 0; i < steps; i++) {
      const angle = (i * 2 * Math.PI) / steps;
      const x = (Math.cos(angle) * width).toFixed(1);
      const y = (Math.sin(angle) * width).toFixed(1);
      shadows.push(`drop-shadow(${x}px ${y}px 0px ${color})`);
    }
    return shadows.join(' ');
  }

  /**
   * @title カスタムCSSの生成とプレビュー適用
   * @description 設定値に基づいてOBS用カスタムCSSを動的に生成し、プレビューエリアに即座に反映します。
   */
  function generateCSS() {
    const selector = selectorInput.value.trim() || '.target-element';
    
    // スタイル調整値の取得
    const size = fontSizeInput.value;
    const weight = fontWeightInput.value;
    const strokeWidth = parseInt(textStrokeWidth.value, 10);
    const strokeColor = textStrokeColor.value;
    const align = alignSelect.value;
    const padding = paddingInput.value;
    const animType = animSelect.value;
    const mode = animMode.value;
    const speed = animSpeed.value;

    // カラー・グラデーション取得
    const type = colorType.value;
    let colorCss = '';
    let previewColorStyle = {};

    if (type === 'solid') {
      const color = fontColor.value;
      colorCss = `  color: ${color} !important;\n`;
      
      const textShadowVal = generateTextShadow(strokeWidth, strokeColor);
      colorCss += `  text-shadow: ${textShadowVal} !important;\n`;
      
      previewColorStyle.color = color;
      previewColorStyle.background = 'none';
      previewColorStyle.webkitBackgroundClip = 'unset';
      previewColorStyle.backgroundClip = 'unset';
      previewColorStyle.webkitTextFillColor = 'unset';
      previewColorStyle.textShadow = textShadowVal;
      previewColorStyle.filter = 'none';
    } else {
      // グラデーション設定
      const gradStart = gradientColorStart.value;
      const gradEnd = gradientColorEnd.value;
      const gradAngle = gradientAngle.value;

      colorCss = `  background: linear-gradient(${gradAngle}deg, ${gradStart}, ${gradEnd}) !important;
  -webkit-background-clip: text !important;
  background-clip: text !important;
  -webkit-text-fill-color: transparent !important;\n`;

      // 競合回避のための filter: drop-shadow 適用
      const filterVal = generateFilterDropShadow(strokeWidth, strokeColor);
      if (filterVal !== 'none') {
        colorCss += `  filter: ${filterVal} !important;\n`;
      }
      colorCss += `  text-shadow: none !important;\n`;

      previewColorStyle.color = 'transparent';
      previewColorStyle.background = `linear-gradient(${gradAngle}deg, ${gradStart}, ${gradEnd})`;
      previewColorStyle.webkitBackgroundClip = 'text';
      previewColorStyle.backgroundClip = 'text';
      previewColorStyle.webkitTextFillColor = 'transparent';
      previewColorStyle.textShadow = 'none';
      previewColorStyle.filter = filterVal === 'none' ? 'none' : filterVal;
    }

    // フォントファミリーの設定
    let fontFamily = fontFamilySelect.value;
    let importUrl = '';
    if (fontFamily === 'custom') {
      const customFont = customFontInput.value.trim();
      if (customFont) {
        fontFamily = `"${customFont}"`;
        const fontNameForUrl = customFont.replace(/\s+/g, '+');
        importUrl = `@import url('https://fonts.googleapis.com/css2?family=${fontNameForUrl}:wght@400;700;800;900&display=swap');`;
        
        // フォント名が実際に変更された場合のみ再読み込みを実行（ラグ対策）
        if (customFont !== lastLoadedFont) {
          lastLoadedFont = customFont;
          fontLoaderStyle.textContent = `@import url('https://fonts.googleapis.com/css2?family=${fontNameForUrl}:wght@400;700;800;900&display=swap');`;
        }
      } else {
        fontFamily = 'sans-serif';
        if (lastLoadedFont !== '') {
          lastLoadedFont = '';
          fontLoaderStyle.textContent = '';
        }
      }
    } else {
      if (lastLoadedFont !== '') {
        lastLoadedFont = '';
        fontLoaderStyle.textContent = '';
      }
    }

    // 配置用CSS定義
    let positionCss = '';
    let transformBase = 'translate(0, 0)';
    if (align === 'center') {
      positionCss = `  position: fixed !important;
  left: 50% !important;
  top: 50% !important;`;
      transformBase = 'translate(-50%, -50%)';
    } else if (align === 'top-left') {
      positionCss = `  position: fixed !important;
  left: ${padding}px !important;
  top: ${padding}px !important;`;
    } else if (align === 'top-right') {
      positionCss = `  position: fixed !important;
  right: ${padding}px !important;
  top: ${padding}px !important;`;
    } else if (align === 'bottom-left') {
      positionCss = `  position: fixed !important;
  left: ${padding}px !important;
  bottom: ${padding}px !important;`;
    } else if (align === 'bottom-right') {
      positionCss = `  position: fixed !important;
  right: ${padding}px !important;
  bottom: ${padding}px !important;`;
    }

    // アニメーション用CSSと@keyframes定義
    let animationCss = '';
    let keyframesCss = '';
    const iterCount = (mode === 'once') ? '1 forwards' : 'infinite';

    if (animType !== 'none') {
      animationCss = `  animation: obs-custom-${animType} ${speed}s ease-in-out ${iterCount} !important;\n`;
      
      if (animType === 'fade') {
        if (mode === 'once') {
          keyframesCss = `
@keyframes obs-custom-fade {
  0% { opacity: 0.3; }
  100% { opacity: 1; }
}`;
        } else {
          keyframesCss = `
@keyframes obs-custom-fade {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}`;
        }
      } else if (animType === 'bounce') {
        if (align === 'center') {
          keyframesCss = `
@keyframes obs-custom-bounce {
  0% { transform: translate(-50%, -50%); }
  50% { transform: translate(-50%, calc(-50% - 15px)); }
  100% { transform: translate(-50%, -50%); }
}`;
        } else {
          keyframesCss = `
@keyframes obs-custom-bounce {
  0% { transform: translateY(0); }
  50% { transform: translateY(-15px); }
  100% { transform: translateY(0); }
}`;
        }
      } else if (animType === 'pulse') {
        if (align === 'center') {
          keyframesCss = `
@keyframes obs-custom-pulse {
  0% { transform: translate(-50%, -50%) scale(1); }
  50% { transform: translate(-50%, -50%) scale(1.08); }
  100% { transform: translate(-50%, -50%) scale(1); }
}`;
        } else {
          keyframesCss = `
@keyframes obs-custom-pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.08); }
  100% { transform: scale(1); }
}`;
        }
      } else if (animType === 'neon') {
        const shadowColor = type === 'solid' ? fontColor.value : gradientColorStart.value;
        keyframesCss = `
@keyframes obs-custom-neon {
  0% { filter: drop-shadow(0 0 2px ${shadowColor}) ${type === 'gradient' ? previewColorStyle.filter : ''}; }
  50% { filter: drop-shadow(0 0 10px ${shadowColor}) ${type === 'gradient' ? previewColorStyle.filter : ''}; }
  100% { filter: drop-shadow(0 0 2px ${shadowColor}) ${type === 'gradient' ? previewColorStyle.filter : ''}; }
}`;
      }
    }

    // ターゲットまでの親要素（祖先要素）をすべて visible にするためのセレクタリスト作成
    const visibilitySelectorList = [];
    
    // セレクタ文字列を " > " で分割して段階的な親要素パスを自動構築
    const segments = selector.split(/\s*>\s*/);
    let currentPath = '';
    
    segments.forEach((seg, idx) => {
      if (seg.trim() !== '') {
        if (idx === 0) {
          currentPath = seg;
        } else {
          currentPath += ' > ' + seg;
        }
        visibilitySelectorList.push(currentPath);
      }
    });

    // ターゲット自身とその子孫を含める
    if (!visibilitySelectorList.includes(selector)) {
      visibilitySelectorList.push(selector);
    }
    
    // カンマ区切りの複数セレクタ文字列を生成
    const visibilitySelectorsStr = [
      ...visibilitySelectorList,
      `${selector} *`
    ].join(',\n');

    // CSSの組み立て
    let outputString = `/* ===================================================
   OBSブラウザソース用 カスタムCSS (簡素化リファクタリング版)
   生成日時: ${new Date().toLocaleString('ja-JP')}
   =================================================== */

/* Google Fontsの読み込み */
${importUrl ? importUrl + '\n' : '/* 外部フォント未指定 */'}
/* 背景全体の透過と全要素の非表示 */
html, body {
  background: transparent !important;
  overflow: hidden !important;
}

body * {
  visibility: hidden !important;
}

/* ターゲット要素とその親（祖先）要素を表示 */
${visibilitySelectorsStr} {
  visibility: visible !important;
}

/* ターゲット要素のスタイルカスタマイズ */
${selector} {
${positionCss}
  transform: ${transformBase} !important;
  font-size: ${size}px !important;
  font-weight: ${weight} !important;
${colorCss}  font-family: ${fontFamily}, sans-serif !important;
  line-height: 1.4 !important; /* フォント下部（5のフックやg, y等）の見切れを防止 */
  overflow: visible !important; /* 太い縁取り影が親のボックスでクリップされるのを防止 */
  padding: ${padding}px !important;
  box-sizing: border-box !important;
  display: inline-block !important;
  white-space: nowrap !important;
${animationCss}}
${keyframesCss}
`;

    cssOutput.value = outputString;

    // プレビュー表示への適用
    previewTarget.style.fontSize = `${size}px`;
    previewTarget.style.fontWeight = weight;
    previewTarget.style.fontFamily = fontFamily;
    previewTarget.style.lineHeight = '1.4'; // プレビューでの見切れ防止
    previewTarget.style.overflow = 'visible'; // プレビューでの縁取りクリップ防止
    previewTarget.style.padding = `${padding}px`;

    // オブジェクトのスタイルをプレビューへ適用
    for (let key in previewColorStyle) {
      previewTarget.style[key] = previewColorStyle[key];
    }

    // アニメーションプレビューの同期とトリガー
    let previewStyleTag = document.getElementById('preview-style-tag');
    if (!previewStyleTag) {
      previewStyleTag = document.createElement('style');
      previewStyleTag.id = 'preview-style-tag';
      document.head.appendChild(previewStyleTag);
    }

    if (animType !== 'none') {
      const loopText = (mode === 'once') ? '1 forwards' : 'infinite';
      const previewAnimationCss = `.preview-target { animation: preview-anim-${animType} ${speed}s ease-in-out ${loopText} !important; }`;
      
      let previewKeyframes = '';
      if (animType === 'fade') {
        previewKeyframes = (mode === 'once')
          ? `@keyframes preview-anim-fade { 0% { opacity: 0.3; } 100% { opacity: 1; } }`
          : `@keyframes preview-anim-fade { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }`;
      } else if (animType === 'bounce') {
        previewKeyframes = `@keyframes preview-anim-bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }`;
      } else if (animType === 'pulse') {
        previewKeyframes = `@keyframes preview-anim-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }`;
      } else if (animType === 'neon') {
        const shadowColor = type === 'solid' ? fontColor.value : gradientColorStart.value;
        previewKeyframes = `@keyframes preview-anim-neon { 0%, 100% { filter: drop-shadow(0 0 2px ${shadowColor}) ${previewColorStyle.filter !== 'none' ? previewColorStyle.filter : ''}; } 50% { filter: drop-shadow(0 0 10px ${shadowColor}) ${previewColorStyle.filter !== 'none' ? previewColorStyle.filter : ''}; } }`;
      }
      
      previewStyleTag.textContent = `${previewAnimationCss}\n${previewKeyframes}`;

      // 「切り替わり時のみ(1回)」が選択されている場合は、コントロール操作時に
      // アニメーションが1回「キュッ」と走るよう、アニメーションを強制再トリガーさせる
      if (mode === 'once') {
        previewTarget.style.animation = 'none';
        void previewTarget.offsetWidth; // リフローを発生させてアニメーション開始状態をリセット
        previewTarget.style.animation = `preview-anim-${animType} ${speed}s ease-in-out 1 forwards`;
      }
    } else {
      previewStyleTag.textContent = '.preview-target { animation: none !important; }';
    }
  }
});
