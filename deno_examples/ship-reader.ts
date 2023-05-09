import {
  createEosioShipReader,
  EosioReaderAbisMap,
  EosioReaderActionFilter,
  EosioReaderConfig,
  EosioReaderTableRowFilter,
  ShipTableDeltaName,
} from '../deno_dist/index.ts'
import { fetchAbi, getInfo, eosioApi } from './utils.ts'

const table_rows_whitelist: () => EosioReaderTableRowFilter[] = () => [
  { code: 'eosio.token', table: 'accounts' },
  /*{ code: 'bitcashtests', scope: 'bitcashtests', table: 'appstates' },
  { code: 'bitcashtests', scope: 'bitcashtests', table: 'exfees' },
  { code: 'bitcashtests', scope: 'bitcashtests', table: 'fees' },
  { code: 'bitcashtests', scope: 'bitcashtests', table: 'accounts' },
  { code: 'bitcashtests', scope: 'bitcashtests', table: 'gpositions' },
  { code: 'bitcashtests', scope: 'bitcashtests', table: 'limits' },
  { code: 'bitcashtests', scope: 'bitcashtests', table: 'positions' },
  { code: 'bitcashtests', scope: 'bitcashtests', table: 'stat' },*/
]

const actions_whitelist: () => EosioReaderActionFilter[] = () => [
  /*{ code: 'bitcashtests', action: '*' },*/
  { code: 'eosio.token', action: '*' },
]

export const loadReader = async () => {
  const info = await getInfo()
  const unique_contract_names = [...new Set(table_rows_whitelist().map((row) => row.code))]
  const abisArr = await Promise.all(unique_contract_names.map((account_name) => fetchAbi(account_name)))

  const contract_abis: () => EosioReaderAbisMap = () => {
    const numap = new Map()
    abisArr.forEach(({ account_name, abi }) => numap.set(account_name, abi))
    return numap
  }

  const delta_whitelist: () => ShipTableDeltaName[] = () => [
    'account_metadata',
    'contract_table',
    'contract_row',
    'contract_index64',
    'resource_usage',
    'resource_limits_state',
  ]

  const eosioReaderConfig: EosioReaderConfig = {
    ws_url: 'ws://65.108.233.61:3333', // 'ws://34.71.234.102:8080',
    rpc_url: eosioApi,
    ds_threads: 6,
    ds_experimental: false,
    delta_whitelist,
    table_rows_whitelist,
    actions_whitelist,
    contract_abis,
    request: {
      start_block_num: info.head_block_num + 10,
      end_block_num: 0xffffffff,
      max_messages_in_flight: 50,
      have_positions: [],
      irreversible_only: false,
      fetch_block: true,
      fetch_traces: true,
      fetch_deltas: true,
    },
    auto_start: true,
  }

  return await createEosioShipReader(eosioReaderConfig)
}
