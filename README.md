# Oli 月光大冒險｜單一遊戲完整版

一個為手機、平板與電腦設計的中秋互動小遊戲。手機與平板請橫向遊玩；直向畫面會顯示旋轉提示。

最簡單的開啟方式：直接雙擊 `啟動遊戲.bat`，系統會啟動網站並自動開啟預設瀏覽器。

也可以手動用本機伺服器開啟（ES Modules 不能用 `file://`）：

```powershell
python -m http.server 4173
```

然後瀏覽 `http://localhost:4173`。

## 素材替換

- Oli 八格角色圖：`assets/characters/oli/oli-sprites.png`（4×2，同一格尺寸）
- Oli 精緻接物動作：`assets/characters/oli/oli-catcher-sprites-v2.png`（4×2）
- 月餅與障礙物：`assets/items/falling-treats.png`（4×2）
- 精緻許願天燈：`assets/props/wish-lantern.png`
- 月餅接接樂場景：`assets/backgrounds/moon-chase-stage.png`
- 家庭結局圖：`assets/characters/family/family-ending.png`
- 路徑集中在 `js/assets.js`；同名覆蓋圖片不需改遊戲邏輯。

## 調整內容

- 完整流程：藝術封面 → 輸入暱稱 → 遊戲 → 分數評價 → 天燈許願 → 專屬祝福 → 家庭 Ending。
- 遊戲時間、速度與生成節奏：`js/catch-game.js` 的 `CFG`
- 分數、Combo 與道具機率：`js/catch-game.js` 的 `TYPES` / `spawn()`
- Oli 即時反應：`js/catch-game.js` 中的 `this.say(...)`
- 首頁、結局祝福與排行榜：`js/main.js`
- 遊戲固定為 30 秒，並依分數給予「桂花小勇士」到「月宮傳說」四種評價與不同祝福。
- 排行榜預設隱藏，只會在使用者點擊「月宮得分榜／查看得分榜」時開啟。
- 排行榜使用 `oliCatchLeaderboard` localStorage；日後可將排行榜讀寫改成雲端資料庫。
- 同一個瀏覽器內，每個暱稱只會保留一筆最高分；重複使用的名字會提示玩家更換。
- GitHub Pages 是純靜態網站，因此排行榜資料保存在各裝置的瀏覽器，不會跨裝置同步。
