<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"));

// DEFINA AQUI O SEU USUÁRIO E SENHA DE PRODUÇÃO
$usuario_correto = "renancriadores"; 
$senha_correta = "renancriadores123";

if ($data->usuario === $usuario_correto && $data->senha === $senha_correta) {
    echo json_encode(["sucesso" => true]);
} else {
    echo json_encode(["sucesso" => false]);
}
?>