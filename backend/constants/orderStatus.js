/* stati della collezione orders condivisi tra orderService (ordini confermati)
   e cartService (carrello in bozza): entrambi i moduli devono riferirsi agli
   stessi valori letterali, altrimenti un refuso in uno dei due farebbe
   sparire silenziosamente un filtro (es. un carrello che finisce negli
   incassi della dashboard) */

/* intero vocabolario di stati che un ordine confermato può assumere: è la
   state machine di orderService (pickup e delivery), usata sia per validare
   l'aggiornamento di stato sia per validare il filtro della coda ordini.
   il carrello in bozza è escluso: non è ancora un ordine effettivo */
const ORDER_STATUSES = ['ordered', 'preparing', 'ready', 'on_delivery', 'delivered'];

module.exports = {
  // stato del carrello prima della conferma (data-model.md §5)
  DRAFT_STATUS: 'draft',
  // unico stato che segna un ordine come concluso
  COMPLETED_STATUS: 'delivered',
  ORDER_STATUSES
};
