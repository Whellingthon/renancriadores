import React, { useEffect } from 'react';

export default function AdBanner({ clientSlot }) {
  useEffect(() => {
    try {
      // Dispara o script do Google AdSense assim que o componente carrega na tela
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error("Erro ao carregar anúncio do AdSense:", err);
    }
  }, []);

  return (
    <div className="my-4 text-center overflow-hidden">
      {/* Bloco de anúncio padrão do Google AdSense */}
      <ins className="adsbygoogle"
           style={{ display: 'block' }}
           data-ad-client="ca-pub-SUA_ID_DE_PUBLISHER_AQUI"
           data-ad-slot={clientSlot}
           data-ad-format="auto"
           data-full-width-responsive="true"></ins>
    </div>
  );
}