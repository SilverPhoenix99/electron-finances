import { App } from "electron";
import '~/App.scss';

import * as electron from 'electron';
console.log(electron);

const App = () => (
    <div className="app">
        <h1>I'm React running in Electron App!!</h1>
    </div>
);

export default App;