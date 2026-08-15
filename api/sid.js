const { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } = require('@whiskeysockets/baileys');
const { MercadoPagoConfig, Payment } = require('mercadopago');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const { Boom } = require('@hapi/boom');
const express = require('express');
const { calcularPrecoPrazo } = require('correios-brasil');

// ⚠️ CORREÇÃO DO CAMINHO DO ARQUIVO .sid PARA O PM2 NÃO SE PERDER
require('dotenv').config({ path: __dirname + '/.sid' });

// --- CONFIGURAÇÃO DE IDENTIDADES (O Cérebro da Maya) ---
const IDENTIDADES = {
    'RENAN': {
        nomeLoja: "Renan Criadores",
        donoJid: "5514997669155@s.whatsapp.net",
        origemCep: "12404259", 
        emailPix: "vendas@renancriadores.com.br",
        cor: "✨",
        saudacao: "Tudo para seu pássaro!"
    },
    'WFIT': {
        nomeLoja: "Wynfit SP",
        donoJid: "5511997498001@s.whatsapp.net",
        origemCep: "12404259", 
        emailPix: "financeiro@wfit.com.br",
        cor: "💪",
        saudacao: "Sua melhor performance começa aqui!"
    },
    'EOS': {
        nomeLoja: "Portal E.O.S",
        donoJid: "5512997498001@s.whatsapp.net",
        origemCep: "12404259", 
        emailPix: "pix@portaleos.com.br",
        cor: "⚡",
        saudacao: "Transforme sua jornada com a Portal E.O.S!"
    }
};

let pedidosAtivos = {};
let payment = null;
let sock = null;
let isBotReady = false; // 🛡️ Controle de prontidão do Socket

async function sidDigitando(sockRef, remoteJid, tempo = 2000) {
    try {
        await sockRef.sendPresenceUpdate('composing', remoteJid);
        await new Promise(r => setTimeout(r, tempo));
        await sockRef.sendPresenceUpdate('paused', remoteJid);
    } catch (e) {}
}

async function notificarDono(sockRef, clienteJid, pedido) {
    const iden = pedido.info;
    const relatorio = `🔔 *VENDA CONFIRMADA (${iden.nomeLoja})* 🚀\n\n` +
                      `👤 *Cliente:* wa.me/${clienteJid.split('@')[0]}\n` +
                      `📦 *Pedido:* R$ ${pedido.valorProdutos.toFixed(2)}\n` +
                      `🚚 *Frete:* ${(pedido.totalComFrete - pedido.valorProdutos).toFixed(2)}\n` +
                      `💰 *TOTAL PAGO:* R$ ${pedido.totalComFrete.toFixed(2)}\n\n` +
                      `✅ *Status:* Pagamento aprovado!`;

    try {
        await sockRef.sendMessage(iden.donoJid, { text: relatorio });
    } catch (err) { console.error("❌ Falha ao notificar dono:", err); }
}

function resetarTimer(from) {
    if (pedidosAtivos[from]?.timer) clearTimeout(pedidosAtivos[from].timer);
    pedidosAtivos[from].timer = setTimeout(() => {
        delete pedidosAtivos[from];
    }, 15 * 60 * 1000);
}

async function iniciarSid() {
    console.log("DEBUG: A função iniciarSid começou!"); 
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const { version } = await fetchLatestBaileysVersion(); 

    const clientMP = new MercadoPagoConfig({ accessToken: 'APP_USR-c8c6f2a3-2061-441d-932a-be97987d3593' });
    payment = new Payment(clientMP);

    sock = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: 'silent' }),
        browser: ['Chrome (Linux)', 'Chrome', '126.0.0.0'] 
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            isBotReady = false;
            console.log('\n📢 --- ESCANEIE O QR CODE ABAIXO --- 📢\n');
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            isBotReady = false;
            const erroReal = lastDisconnect?.error;
            const statusCode = new Boom(erroReal)?.output?.statusCode;
            
            console.log(`\n❌ CONEXÃO FECHADA! Status: ${statusCode}`);
            console.log(`❌ Motivo Técnico:`, erroReal?.message || erroReal);

            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) {
                console.log("⏳ Tentando reconectar em 5 segundos...\n");
                setTimeout(iniciarSid, 5000); 
            } else {
                console.log("⛔ Sessão corrompida ou deslogada (Logged Out). A VPS abortou a tentativa.");
            }
        } else if (connection === 'open') {
            isBotReady = true; // ✅ Liberado para envios
            console.log('\n✅ CONECTADO COM SUCESSO! A Maya está online.');
        }
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || "").trim();
        const textUP = text.toUpperCase();

        try {
            let detectado = null;
            if (textUP.includes('RENAN')) detectado = 'RENAN';
            else if (textUP.includes('WFIT') || textUP.includes('WYNFIT')) detectado = 'WFIT';
            else if (textUP.includes('EOS') || textUP.includes('PORTAL EOS')) detectado = 'EOS';
            
            if (detectado) {
                const valorMatch = text.match(/Pedido:\s*(?:R\$\s?)?([\d.,]+)/i);
                
                if (valorMatch) {
                    let bruto = valorMatch[1];
                    let valorTotal;

                    if (bruto.includes(',')) {
                        valorTotal = parseFloat(bruto.replace(/\./g, '').replace(',', '.'));
                    } else if (bruto.includes('.')) {
                        valorTotal = parseFloat(bruto);
                    } else {
                        valorTotal = parseFloat(bruto) / 100;
                    }

                    const iden = IDENTIDADES[detectado];

                    pedidosAtivos[from] = { 
                        valorProdutos: valorTotal,
                        info: iden,
                        status: 'AGUARDANDO_CEP' 
                    };
                    resetarTimer(from);

                    await sidDigitando(sock, from, 1500);
                    const saudacao = `Olá! Sou a *Maya*! ${iden.cor}\n\nIdentifiquei seu pedido na *${iden.nomeLoja}*.\n💰 Valor dos produtos: *R$ ${valorTotal.toFixed(2)}*\n\n📍 Para calcularmos o frete, por favor, digite o seu *CEP*:`;
                    await sock.sendMessage(from, { text: saudacao });
                    return; 
                }
            }

            const pedido = pedidosAtivos[from];
            if (!pedido) return;

            if (/^\d{8}$/.test(text.replace(/\D/g, '')) && pedido.status === 'AGUARDANDO_CEP') {
                const cepLimpo = text.replace(/\D/g, '');
                await sidDigitando(sock, from, 1500);
                
                try {
                    const argsCorreios = {
                        sCepOrigem: pedido.info.origemCep,
                        sCepDestino: cepLimpo,
                        nVlPeso: '1',
                        nCdFormato: '1',
                        nVlComprimento: '20',
                        nVlAltura: '20',
                        nVlLargura: '20',
                        nCdServico: ['04014', '04510'], 
                        nVlDiametro: '0',
                    };

                    const timeoutPromise = new Promise((_, reject) =>
                        setTimeout(() => reject(new Error("Timeout: Os Correios demoraram mais de 6 segundos.")), 6000)
                    );

                    const response = await Promise.race([
                        calcularPrecoPrazo(argsCorreios),
                        timeoutPromise
                    ]);
                    
                    if (!response || response.length === 0) {
                        throw new Error("API dos Correios retornou vazio.");
                    }

                    let freteEscolhido = response.find(serv => serv.Codigo === '04014' && serv.Erro === '0');
                    if (!freteEscolhido) {
                        freteEscolhido = response.find(serv => serv.Codigo === '04510' && serv.Erro === '0');
                    }

                    if (!freteEscolhido) {
                        throw new Error(`Correios recusou o CEP: ${response[0]?.MsgErro || "Sem cobertura"}`);
                    }

                    const frete = parseFloat(freteEscolhido.Valor.replace(',', '.')); 
                    const prazo = freteEscolhido.PrazoEntrega;
                    const nomeServico = freteEscolhido.Codigo === '04014' ? 'Sedex' : 'PAC';

                    pedido.totalComFrete = pedido.valorProdutos + frete;
                    pedido.status = 'AGUARDANDO_PAGAMENTO';
                        
                    const resumo = `🚚 *FRETE CALCULADO (Correios - ${nomeServico})*\n📦 Prazo estimado: ${prazo} dias úteis\n💰 Frete: R$ ${frete.toFixed(2)}\n\n✅ *TOTAL GERAL: R$ ${pedido.totalComFrete.toFixed(2)}*\n\nDigite *GERAR PIX* para concluir. ✨`;
                    await sock.sendMessage(from, { text: resumo });

                } catch (e) {
                    console.error("❌ Falha no Frete:", e.message);
                    pedido.totalComFrete = pedido.valorProdutos + 25.00;
                    pedido.status = 'AGUARDANDO_PAGAMENTO';
                    await sock.sendMessage(from, { text: "⚠️ Sistema de cálculo temporariamente indisponível. Apliquei um frete fixo de R$ 25,00.\n\nDigite *GERAR PIX* para continuar." });
                }
                return;
            }

            if (textUP === 'GERAR PIX' && pedido.status === 'AGUARDANDO_PAGAMENTO') {
                await sidDigitando(sock, from, 2000);
                
                try {
                    if (!payment) {
                        throw new Error("SDK do Mercado Pago não inicializado.");
                    }

                    const body = {
                        transaction_amount: Number(pedido.totalComFrete.toFixed(2)),
                        description: `Pedido ${pedido.info.nomeLoja} - MayaBot`,
                        payment_method_id: 'pix',
                        payer: {
                            email: 'comprador@email.com',
                            first_name: 'Cliente'
                        }
                    };

                    const result = await payment.create({ body });
                    const pointOfInteraction = result.point_of_interaction;
                    
                    if (pointOfInteraction && pointOfInteraction.transaction_data) {
                        const qrCodeCopiaECola = pointOfInteraction.transaction_data.qr_code;

                        const msgPix = `✅ *COBRANÇA PIX GERADA (${pedido.info.nomeLoja})*\n\n` +
                                       `💰 Valor Total (Produtos + Frete): *R$ ${pedido.totalComFrete.toFixed(2)}*\n\n` +
                                       `📋 *Pix Copia e Cola (Copie abaixo):*\n\`\`\`${qrCodeCopiaECola}\`\`\`\n\n` +
                                       `_Cole o código no aplicativo do seu banco para pagar._ ✨`;

                        await sock.sendMessage(from, { text: msgPix });
                    } else {
                        throw new Error("Não foi possível obter os dados do Pix do Mercado Pago.");
                    }

                } catch (mpError) {
                    console.error("Erro ao gerar Pix no Mercado Pago:", mpError.message);
                    const msgManual = `✅ *PAGAMENTO (${pedido.info.nomeLoja})*\n\n` +
                                      `💰 Valor Total: *R$ ${pedido.totalComFrete.toFixed(2)}*\n` +
                                      `🔑 Chave PIX: *${pedido.info.emailPix}*\n\n` +
                                      `_Envie o comprovante para confirmação._ ✨`;
                    await sock.sendMessage(from, { text: msgManual });
                }
            }
            else if (textUP === 'TESTE FINALIZAR') {
                await sock.sendMessage(from, { text: "🎉 *Pagamento Aprovado (Simulação)*" });
                await notificarDono(sock, from, pedido);
                delete pedidosAtivos[from];
            }

        } catch (err) { console.error("Erro Maya:", err.message); }
    });
}

// --- CONFIGURAÇÃO DO EXPRESS E ROTA 2FA BLINDADA ---
const app = express();
app.use(express.json());

app.post('/enviar-2fa', async (req, res) => {
    const { telefone, codigo } = req.body;
    console.log(`\n📲 Recebida requisição 2FA para o telefone: ${telefone} com o código: ${codigo}`);

    if (!telefone || !codigo) {
        return res.status(400).json({ sucesso: false, erro: 'Telefone ou código ausente.' });
    }

    // 🛡️ Validação se o socket existe e está conectado
    if (!isBotReady || !sock || !sock.ws || sock.ws.readyState !== sock.ws.OPEN) {
        console.log('⚠️ Tentativa de 2FA rejeitada: Bot ainda não está conectado ou socket fechado.');
        return res.status(503).json({ 
            sucesso: false, 
            erro: 'O bot do WhatsApp está reconectando ou offline no momento. Tente novamente em alguns segundos.' 
        });
    }

    try {
        const numeroLimpo = telefone.replace(/\D/g, '');
        const jid = `${numeroLimpo}@s.whatsapp.net`;
        const mensagem = `🔐 *SISTEMA SID-MAYA*\n\nSeu código de verificação para o painel é: *${codigo}*.\n\n_Válido por 5 minutos._ ✨`;

        console.log(`📤 Tentando enviar mensagem para JID: ${jid}`);
        const resultadoEnvio = await sock.sendMessage(jid, { text: mensagem });
        console.log(`✅ Mensagem enviada com sucesso! Resposta do Baileys:`, resultadoEnvio);

        res.json({ sucesso: true, mensagem: 'Código 2FA enviado com sucesso pelo Maya-bot!' });
    } catch (error) {
        console.error("❌ ERRO CRÍTICO AO ENVIAR 2FA:", error);
        res.status(500).json({ sucesso: false, erro: error.message });
    }
});

if (!global.expressServerRunning) {
    app.listen(3000, () => {
        console.log('🌐 Servidor HTTP do Maya-bot rodando na porta 3000');
    });
    global.expressServerRunning = true;
}

iniciarSid().catch(e => console.error("Erro fatal na inicialização:", e));