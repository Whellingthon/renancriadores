<?php
session_start();
$_SESSION['usuario_id'] = 1; // Cria a credencial na memória do navegador
echo "Sessão iniciada! Agora o botão vai funcionar.";
?>