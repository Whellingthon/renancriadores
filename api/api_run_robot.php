<?php
// 1. Herda headers e configurações (CORS resolvido aqui)
require_once 'api_get_config.php';

// Aumenta o tempo para o Puppeteer não morrer no meio do processo
set_time_limit(180); 

// No Linux da VPS, o caminho do node costuma ser fixo
$nodePath = "/usr/bin/node"; 
// Certifique-se que o robot.js está no local correto na Hostinger
$scriptPath = __DIR__ . "/../robot.js";

$comando = "export HOME=/tmp; " . $nodePath . " " . $scriptPath . " 2>&1";
$output = shell_exec($comando);

if (strpos($output, 'Sucesso') !== false || strpos($output, 'concluída') !== false) {
    echo json_encode([
        "success" => true, 
        "message" => "O robô da VPS executou com sucesso!",
        "output" => $output
    ]);
} else {
    echo json_encode([
        "success" => false, 
        "message" => "Falha ao rodar o robô na Hostinger.",
        "details" => $output
    ]);
}