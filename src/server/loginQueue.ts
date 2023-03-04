import { SocketWrapperInterface } from "./worldServer";

class FiniteStateMachine {

    currentState_:any;
    onEvent_:onEventInterface;

    constructor(onEvent:onEventInterface) {
        this.currentState_ = null;
        this.onEvent_ = onEvent;
    }

    get State() {
        return this.currentState_;
    }

    Broadcast(evt:any) {
        this.onEvent_(evt);
    }

    OnMessage(evt:string, data: any) {
        return this.currentState_.OnMessage(evt, data);
    }

    SetState(state:any) {
        const prevState = this.currentState_;
    
        if (prevState) {
            prevState.OnExit();
        }
    
        this.currentState_ = state;
        this.currentState_.parent_ = this;
        state.OnEnter(prevState);
    }
}

class State {

    public parent_: any;

    constructor() {}

    Broadcast(evt:any) {
        this.parent_.Broadcast(evt);
    }

    OnEnter() {}

    OnMessage(evt:string, data:any) {}

    OnExit() {}
}

interface LoginAwaitParams {
    accountName?: string
}

class Login_Await extends State {

    params_:LoginAwaitParams;

    constructor() {
        super();
        this.params_ = {};
    }

    OnMessage(evt:string, data:string) {
        if (evt != "login.commit") {
            return false;
        }
    
        this.params_.accountName = data;
        this.parent_.SetState(new Login_Confirm(this.params_));
    
        return true;
    }
}

class Login_Confirm extends State {

    params_:LoginAwaitParams;

    constructor(params:LoginAwaitParams) {
        super();
        this.params_ = { ...params };
    }

    OnEnter() {
        console.log("login confirmed: " + this.params_.accountName);
        this.Broadcast({ topic: "login.complete", params: this.params_ });
    }

    OnMessage() {
        return true;
    }
}

export interface onLoginInteface {
    (c: any): void;
}

interface onEventInterface {
    (e:any): void
}

class LoginClient {

    onLogin_;
    fsm_;

    constructor(client:SocketWrapperInterface, onLogin:onLoginInteface) {
        this.onLogin_ = onLogin;

        client.onMessage = (e:string, d:any) => this.OnMessage_(e, d);

        this.fsm_ = new FiniteStateMachine((e:any) => {
            this.OnEvent_(e);
        });
        this.fsm_.SetState(new Login_Await());
    }

    OnEvent_(evt:any) {
        this.onLogin_(evt.params);
    }

    OnMessage_(topic:string, data:any) {
        return this.fsm_.OnMessage(topic, data);
    }
}

export interface LoginQueueInteface {
    Add(client:SocketWrapperInterface): void
    OnLogin_(client:SocketWrapperInterface, params:OnLoginParams): void
}

export interface OnLoginParams {
    accountName: string
}

//:SocketWrapperInterface, p:OnLoginParams
export interface OnLoginInteface {
    (c: SocketWrapperInterface, p: OnLoginParams): void;
}

export class LoginQueue implements LoginQueueInteface {

    clients_:any;
    onLogin_:OnLoginInteface;

    //function(c: any, p: any): void
    constructor(onLogin:OnLoginInteface) {
        this.clients_ = {};
        this.onLogin_ = onLogin;
    }

    Add(client:SocketWrapperInterface) {
        this.clients_[client.ID] = new LoginClient(client, (e:any) => {
            this.OnLogin_(client, e);
        });
    }

    OnLogin_(client:SocketWrapperInterface, params:any) {
        delete this.clients_[client.ID];

        this.onLogin_(client, params);
    }
}
