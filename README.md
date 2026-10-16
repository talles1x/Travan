# Travan — passagens de van e ônibus pelo celular

App para **empresas de transporte intermunicipal** venderem passagens sem fila no guichê. O passageiro escolhe a viagem e o assento, paga com Pix e embarca mostrando o QR code. A empresa acompanha as vendas do dia e o motorista valida o embarque pelo próprio app.

![Telas do Travan](docs/telas.png)

## O que o app faz

**Para o passageiro**

- Cadastro e login (senha guardada com hash SHA-256)
- Busca por origem, destino e data, com filtro de manhã ou tarde e aviso de "últimos assentos"
- Mapa de assentos de verdade, com o layout de cada veículo (van 2+1, micro e ônibus 2+2) e indicação de janela e corredor
- Até 4 passageiros por compra, com nome e CPF validado pelos dígitos verificadores
- Pagamento com **Pix**: QR code e "copia e cola" no padrão BR Code (EMV com CRC16), com prazo de 10 minutos e liberação automática dos assentos quando expira
- Bilhete digital com QR code e código de 6 caracteres, que pode ser compartilhado
- Cancelamento com reembolso até 3 horas antes da partida
- Abas "Próximas" e "Histórico", com destaque da próxima viagem na tela inicial

**Para a empresa e o motorista** (*Perfil → Painel da operação*)

- Resumo do dia: receita prevista, passagens vendidas, número de viagens e ocupação média
- Embarque: o motorista digita o código do passageiro e o app libera o embarque, ou recusa se a passagem for de outra viagem, já tiver sido usada ou não estiver paga

## Usabilidade e acessibilidade

- Alvos de toque de pelo menos 44 pt e botão principal sempre fixo no rodapé
- Rótulos para leitores de tela (VoiceOver/TalkBack) em assentos, viagens e QR codes
- Erros de formulário mostrados no próprio campo, com teclado e auto-preenchimento certos para cada tipo de dado
- Vibração ao escolher assento e ao confirmar pagamento ou embarque

## Tecnologias

React Native 0.88 · Expo SDK 58 · Expo Router · TypeScript · AsyncStorage · react-native-qrcode-svg · expo-crypto · expo-clipboard · expo-haptics

## Como rodar

```bash
git clone https://github.com/talles1x/travan.git
cd travan
npm install
npx expo start
```

Leia o QR code com o app **Expo Go** no celular, ou aperte `w` para abrir no navegador.

Para testar a compra completa: crie uma conta, busque **Monteiro → Campina Grande** para amanhã, escolha um assento e use o CPF de teste `529.982.247-25`. Na tela do Pix, toque em **Simular pagamento aprovado**. Depois, em *Perfil → Painel da operação*, valide o código da passagem.

## Estrutura

```
src/
├── app/                  # telas (Expo Router)
│   ├── (tabs)/           # Buscar, Passagens e Perfil
│   ├── trip/[id].tsx     # mapa de assentos
│   ├── checkout/[id].tsx # dados dos passageiros
│   ├── pix/[ticketId].tsx
│   ├── ticket/[id].tsx   # bilhete com QR code
│   └── operation.tsx     # painel da empresa e embarque
├── components/           # UI, SeatMap, TripCard, CityPicker
├── lib/                  # catálogo de rotas, store, Pix, formatação
├── hooks/
└── constants/theme.ts    # cores, espaçamentos e tipografia
```

## Próximos passos para produção

Os dados ficam salvos no próprio aparelho, para o app funcionar sem servidor. Para vender a uma empresa, falta:

- Back-end com banco de dados (Supabase, por exemplo) para sincronizar assentos entre passageiros
- Integração com um provedor de Pix (Mercado Pago, Efí, Asaas) e webhook de confirmação
- Leitura do QR code pela câmera no painel do motorista (`expo-camera`)
- Build nas lojas com EAS (`eas build`)

## Créditos

O Travan nasceu como projeto da disciplina *Desenvolver Aplicativos para Dispositivos Móveis e IoT* (UNIFACISA, 2025), feito em equipe por Eduardo Sena, Francinaldo Batista, Gabryell Leal, Pablo Selares e Talles Oliveira. Versões originais: [Batissta/travan-react-native](https://github.com/Batissta/travan-react-native) e [PabloSelares/FrontEnd-Travan](https://github.com/PabloSelares/FrontEnd-Travan).

Esta versão 2.0 foi reconstruída por **Talles Oliveira** no Expo SDK 58, com mapa de assentos, Pix, bilhete digital e painel da operação.

Licença MIT, veja [LICENSE](LICENSE).
