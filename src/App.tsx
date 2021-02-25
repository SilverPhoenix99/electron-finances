import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import '~/App.scss';
import Page from "~/components/Page";

const App = () => (
    <Router>
        <Switch>
            <Route exact path="/">
                <Page />
            </Route>
        </Switch>
    </Router>
);

export default App;