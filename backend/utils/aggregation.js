/* funzioni di supporto per trasformare i risultati di una aggregate $group
   di mongoose in una struttura più comoda da consumare lato client, condivise
   tra le statistiche di piattaforma (adminController) e la dashboard di
   filiale (orderController), per non ripetere la stessa riduzione due volte. */

// aggrega i conteggi per chiave (es. ruolo, stato ordine) di un array di risultati $group in un oggetto { chiave: conteggio }
function countsByKey(groupedResults) {
  return groupedResults.reduce((counts, { _id, count }) => {
    counts[_id] = count;
    return counts;
  }, {});
}

module.exports = { countsByKey };
