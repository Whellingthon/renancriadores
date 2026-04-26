import puppeteer from 'puppeteer';
import mysql from 'mysql2/promise';

console.log("🚀 Iniciando busca de preços na Penna Firme (Loja Integrada)...");

const db = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', 
    database: 'loja_viva'
});

const browser = await puppeteer.launch({
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});
const clientes = await db.query("SELECT id, url_fornecedor FROM configuracoes_clientes");

for (let cliente of clientes) {
  await varrerSite(cliente.url_fornecedor, cliente.id);
}
const page = await browser.newPage();
await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

try {
    // 1. URL de Alimentação
    console.log("📡 Acessando a seção de Alimentação...");
    await page.goto('https://www.comercialpennafirme.com.br/alimentacao', { 
        waitUntil: 'networkidle2',
        timeout: 90000 
    });

    console.log("⏳ Aguardando renderização da Loja Integrada...");
    // 2. Esperamos pela classe real de listagem de produtos da plataforma
    await page.waitForSelector('.listagem-item', { timeout: 20000 });

    // 3. Extração dos Dados com os seletores da Loja Integrada
    const produtos = await page.evaluate(() => {
        const itens = [];
        const cards = document.querySelectorAll('.listagem-item');
        
        cards.forEach(card => {
            const nome = card.querySelector('.nome-produto')?.innerText.trim();
            // Pega o preço promocional ou o de venda
            const precoElement = card.querySelector('.preco-promocional') || card.querySelector('.preco-venda');
            const precoRaw = precoElement?.innerText.trim();
            const imagem = card.querySelector('.imagem-produto img')?.src;
            
            if (nome && precoRaw) {
                itens.push({ nome, precoRaw, imagem });
            }
        });
        return itens;
    });

    if (produtos.length === 0) {
        console.log("⚠️ Nenhum produto encontrado nos seletores da Loja Integrada.");
    } else {
        console.log(`🔎 Encontrados ${produtos.length} produtos. Sincronizando com o MySQL local...`);

        for (const p of produtos) {
            // Limpa o preço: "R$ 84,90" -> 84.90
            const precoLimpo = parseFloat(p.precoRaw.replace('R$', '').replace(/\./g, '').replace(',', '.').trim());

            await db.execute(
                "INSERT INTO produtos (nome, preco_custo, imagem_url) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE preco_custo = VALUES(preco_custo), imagem_url = VALUES(imagem_url)",
                [p.nome, precoLimpo, p.imagem || '']
            );
        }
        console.log("✅ Sucesso! O banco 'loja_viva' de Pindamonhangaba foi atualizado.");
    }

} catch (error) {
    console.error("❌ O robô falhou:", error.message);
} finally {
    await browser.close(); 
    await db.end();
}