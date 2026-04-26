<?php
// 1. Conecta ao banco usando seu novo padrão seguro
require_once 'api_get_config.php';

$url = "https://www.comercialpennafirme.com.br/";

// ... (seu código de CURL aqui) ...

$doc = new DOMDocument();
@$doc->loadHTML('<?xml encoding="UTF-8">' . $html); // Ajuste para não quebrar acentos
$xpath = new DOMXPath($doc);

// AJUSTE OS SELETORES ABAIXO conforme o site real
$items = $xpath->query("//div[contains(@class, 'product-item')]"); 

foreach ($items as $item) {
    $nomeNode = $xpath->query(".//a[contains(@class, 'product-item-link')]", $item)->item(0);
    $precoNode = $xpath->query(".//span[contains(@class, 'price')]", $item)->item(0);

    if ($nomeNode && $precoNode) {
        $nome = trim($nomeNode->nodeValue);
        $precoTexto = $precoNode->nodeValue;
        
        $precoLimpo = preg_replace('/[^0-9,]/', '', $precoTexto);
        $precoFinal = (float)str_replace(',', '.', $precoLimpo);

        // 2. SALVA NO BANCO (Evita duplicados pelo nome)
        $stmt = $pdo->prepare("INSERT INTO produtos (nome, preco_custo) 
                               VALUES (:nome, :preco) 
                               ON DUPLICATE KEY UPDATE preco_custo = :preco");
        $stmt->execute(['nome' => $nome, 'preco' => $precoFinal]);
        
        echo "✅ Atualizado: $nome - R$ $precoFinal <br>";
    }
}