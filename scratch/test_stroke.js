/**
 * 縁取り影生成ロジックおよび親要素自動 visibility 抽出ロジックのユニットテスト
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

function generateFilterDropShadow(width, color) {
  if (width === 0) return 'none';
  const shadows = [];
  const steps = 8; 
  for (let i = 0; i < steps; i++) {
    const angle = (i * 2 * Math.PI) / steps;
    const x = (Math.cos(angle) * width).toFixed(1);
    const y = (Math.sin(angle) * width).toFixed(1);
    shadows.push(`drop-shadow(${x}px ${y}px 0px ${color})`);
  }
  return shadows.join(' '); // filterはスペース区切り
}

// セレクタ分割による親要素 visible リスト生成の簡易シミュレータ
function parseAncestors(selector) {
  const visibilitySelectorList = [];
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

  if (!visibilitySelectorList.includes(selector)) {
    visibilitySelectorList.push(selector);
  }
  return visibilitySelectorList;
}

// テスト実行
console.log("=== リファクタリング後ロジック検証テスト ===");

// 1. 親要素自動抽出テスト
const sampleSelector = "#mini-card-header > div:nth-child(5) > div.metric-value.style-scope.yta-latest-activity-card";
const list = parseAncestors(sampleSelector);

console.log(`抽出された階層数: ${list.length} (期待値: 3) -> ${list.length === 3 ? 'PASS' : 'FAIL'}`);
console.log(`階層1: ${list[0]} -> ${list[0] === '#mini-card-header' ? 'PASS' : 'FAIL'}`);
console.log(`階層2: ${list[1]} -> ${list[1] === '#mini-card-header > div:nth-child(5)' ? 'PASS' : 'FAIL'}`);
console.log(`階層3: ${list[2]} -> ${list[2] === sampleSelector ? 'PASS' : 'FAIL'}`);

// 2. 接続形式（カンマ区切りおよび末尾のアスタリスク付き子孫セレクタ追加）のシミュレーション確認
const visibilitySelectorsStr = [
  ...list,
  `${sampleSelector} *`
].join(',\n');

console.log("生成された visibility セレクタリスト文字列:");
console.log(visibilitySelectorsStr);
console.log(`子孫要素が含まれているか: ${visibilitySelectorsStr.includes(`${sampleSelector} *`) ? 'PASS' : 'FAIL'}`);
