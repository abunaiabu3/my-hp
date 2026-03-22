const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
app.use(express.json());
app.use(express.static('.')); // index.html を静的配信

const client = new Anthropic(); // ANTHROPIC_API_KEY を環境変数から取得

// 税理士事務所アシスタントのシステムプロンプト
const SYSTEM_PROMPT = `あなたはこのHPの案内役AIアシスタントです。常にこのHPの内容にもとづいて、来訪者が知りたいことをわかりやすく説明してください。口調は丁寧で、親しみやすくしてください。わからない情報は、推測せずに「HP上に記載がないため分かりません」と答えてください。

【このHPに記載されている情報】
- 事務所名：〇〇税理士事務所
- サービス：税務相談・申告 / 記帳・月次決算 / AI・自動化による業務効率化支援（チャットボット・AIツール導入支援を含む）
- ターゲット：個人事業主・中小企業
- 初回相談：無料
- 面談：オンライン・対面どちらでも対応可能
- 問い合わせ：HPのお問い合わせフォームから受付`;

// CORSプリフライト対応
app.options('/api/chat', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.sendStatus(200);
});

// チャットAPIエンドポイント（JSON応答）
app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages フィールドが必要です' });
  }

  try {
    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages,
    });

    const text = response.content[0].text;
    return res.status(200).json({ text });
  } catch (err) {
    console.error('Claude API エラー:', err.message);
    return res.status(500).json({ error: 'AIとの通信でエラーが発生しました。しばらくしてから再度お試しください。' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`サーバー起動中: http://localhost:${PORT}`);
  console.log('ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? '設定済み ✓' : '未設定 ✗ (起動前に設定してください)');
});
