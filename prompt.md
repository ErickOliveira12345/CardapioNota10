Sistema de gerenciamento de pedidos

Iniciaremos um MVP para um Sistema de gerenciamento de pedidos utilizando apenas HTML CSS E JS. com o lado client e estabelecimento (adm)

O Sistema deve gerar um pedido para o cliente, linkando o número/id da mesa com o pedido realizado.

Fluxo: Cliente chega no restaurante -> escaneia o QRCode -> Abre uma tela com opções de menu ex: bebidas, poções, etc (e um botão de 'solicitar atendimento'). ao clicar em uma das opções de menu, se abre uma tela com o cardápio referente ao menu selecionado. onde o cliente selecionará os itens desejados e estes serão alimentados em um carrinho, que persistirá via local storage no browser.

Ao solicitar atendimento pelo botão, um aviso é enviado a seção Estabelecimento (adimn), piscando em vermelho 'Mesa numero 'id' solicita atendimento 

Na seção Estabelecimento(admin) o adm poderá visualizar qual pedido cada mesa fez. e quando fez. Modificar estados de cada pedido que serão retornados visualmente na seção do cliente ex: pedido aguardando atendimento, pedido em preparação, etc.

### o sistema de scan de qrcode será uma simulação. No lado do cliente, haverá de início, imagens de qrcode alocadas em um array, puxadas da pasta src/img
