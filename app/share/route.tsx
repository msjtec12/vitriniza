import { ImageResponse } from 'next/og';

export function GET() {
  return new ImageResponse(
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', width: '100%', height: '100%', padding: 80, background: '#F8F6F0', color: '#0E3B43' }}>
      <div style={{ display: 'flex', fontSize: 38, color: '#E36845', marginBottom: 32 }}>VITRINIZA</div>
      <div style={{ display: 'flex', fontSize: 64, fontWeight: 700 }}>Descubra comércios e serviços da Zona Leste.</div>
      <div style={{ display: 'flex', fontSize: 30, marginTop: 32 }}>Guaianases e bairros cadastrados · Contato direto pelo WhatsApp</div>
    </div>,
    { width: 1200, height: 630 }
  );
}
