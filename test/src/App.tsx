// import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

import { mainStore, usePiniaStore } from './store'
import { useSetup } from './hooks/setup'
import { proxyRefs, ref } from '@vue/runtime-core'

const AppSetup = () => {
  const count = ref(0)

  const setCount = (value: number | ((v: number) => number)) => {
    if (typeof value === 'function') {
      count.value = value(count.value)
    } else {
      count.value = value
    }
  }
  return proxyRefs({ count, setCount })
}

function App(props: object) {
  // const [count, setCount] = useState(0)

  const { count, setCount } = useSetup(AppSetup, props)

  const storeCount = usePiniaStore(mainStore, (state) => state.count)
  const store = usePiniaStore(mainStore)

  return (
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => { setCount(c => c + 1) }}>
          count is {count}
        </button>
        <button onClick={() => mainStore.addCount()}>
          store count is {storeCount}
        </button>
        <button onClick={() => store.addCount()}>
          store count is {store.count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
