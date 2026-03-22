import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic(); // ANTHROPIC_API_KEY を環境変数から自動取得

// このHPの案内役AIアシスタント用システムプロンプト
const SYSTEM_PROMPT = `あなたはこのHPの案内役AIアシスタントです。常にこのHPの内容にもとづいて、来訪者が知りたいことをわかりやすく説明してください。口調は丁寧で、親しみやすくしてください。わからない情報は、推測せずに「HP上に記載がないため分かりません」と答えてください。

【このHPに記載されている情報】
- 事務所名：〇〇税理士事務所
- サービス：税務相談・申告 / 記帳・月次決算 / AI・自動化による業務効率化支援（チャットボット・AIツール導入支援を含む）
- ターゲット：個人事業主・中小企業
- 初回相談：無料
- 面談：オンライン・対面どちらでも対応可能
- 問い合わせ：HPのお問い合わせフォームから受付`;

// Vercel サーバーレス関数ハンドラー（非ストリーミング・JSON応答）
export default async function handler(req, res) {
  // CORS プリフライト対応
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
}
