/* stati della collezione orders condivisi tra orderService (ordini confermati)
   e cartService (carrello in bozza): entrambi i moduli devono riferirsi agli
   stessi valori letterali, altrimenti un refuso in uno dei due farebbe
   sparire silenziosamente un filtro (es. un carrello che finisce negli
   incassi della dashboard) */
module.exports = {
  // stato del carrello prima della conferma (data-model.md §5)
  DRAFT_STATUS: 'draft',
  // unico stato che segna un ordine come concluso
  COMPLETED_STATUS: 'delivered'
};
