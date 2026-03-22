import express from 'express';
import Anthropic from '@anthropic-ai/sdk';

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

// チャットAPIエンドポイント（SSEストリーミング）
app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages フィールドが必要です' });
  }

  // SSEヘッダーを設定
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const stream = client.messages.stream({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages,
    });

    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    console.error('Claude API エラー:', err.message);
    res.write(`data: ${JSON.stringify({ error: 'AIとの通信でエラーが発生しました。しばらくしてから再度お試しください。' })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

// CORSプリフライト対応
app.options('/api/chat', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`サーバー起動中: http://localhost:${PORT}`);
  console.log('ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? '設定済み ✓' : '未設定 ✗ (起動前に設定してください)');
});
