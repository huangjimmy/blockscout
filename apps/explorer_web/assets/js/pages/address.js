import $ from 'jquery'
import humps from 'humps'
import socket from '../socket'
import router from '../router'
import { batchChannel } from '../utils'

router.when('/addresses/:addressHash').then(({ addressHash, blockNumber, filter }) => {
  const channel = socket.channel(`addresses:${addressHash}`, {})
  const $channelDisconnected = $('[data-selector="channel-disconnected-message"]')
  channel.join()
    .receive('ok', resp => { console.log('Joined successfully', `addresses:${addressHash}`, resp) })
    .receive('error', resp => { console.log('Unable to join', `addresses:${addressHash}`, resp) })
  channel.onError(() => {
    $channelDisconnected.show()
  })

  if (!blockNumber) {
    const $emptyTransactionsList = $('[data-selector="empty-transactions-list"]')
    if ($emptyTransactionsList.length) {
      channel.on('transaction', () => {
        window.location.reload()
      })
    }

    const $transactionsList = $('[data-selector="transactions-list"]')
    if ($transactionsList.length) {
      channel.on('transaction', batchChannel((msgs) => {
        if ($channelDisconnected.is(':visible')) {
          return
        }

        msgs = humps.camelizeKeys(msgs)

        if (filter === 'to') {
          msgs = msgs.filter(({toAddressHash})=>toAddressHash===addressHash)
        }
        if (filter === 'from') {
          msgs = msgs.filter(({fromAddressHash})=>fromAddressHash===addressHash)
        }

        const transactionsHtml = msgs.map(({transactionHtml})=>transactionHtml).join('')
        $transactionsList.prepend(transactionsHtml)
      }))
    }
  }
})
