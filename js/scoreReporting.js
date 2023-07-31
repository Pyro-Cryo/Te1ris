const SCORE_ENDPOINT = "https://f.kth.se/cyberfohs/set_game_highscore";
let ApiSettings = null;

class ScoreReporter {
    static set apiSettings(value) {
        ApiSettings = value;
        console.log("Satte API-parametrar:", value);
    }
    static get apiSettings() {
        return ApiSettings;
    }

    static onNoParamsDefault() {
        console.warn("API-parametrarna är inte definierade, så kan inte rapportera in poängen.");
    }

    /**
     * Rapporterar in poängen för spelaren.
     * @param {number} score 
     * @param {() => any} onSuccess 
     * @param {(r: any) => any} onFail 
     * @param {() => any} onNoParams 
     * @returns 
     */
    static report(score, onSuccess = null, onFail = null, onNoParams = this.onNoParamsDefault) {
        const url = new URL(window.location.href);
        const token = url.searchParams.get("token");
        if (!this.apiSettings && token !== null) {
            this.apiSettings = {
                token: token,
            };
        }
        
        // alert("API-inställningar: " + JSON.stringify(this.apiSettings));
        if (!this.apiSettings) {
            if (onNoParams) onNoParams();
            return;
        }
        console.log("Rapporterar poäng:", score);

        // Rapportera in individuell poäng
        const data = { "score": score };
        fetch(
            SCORE_ENDPOINT,
            {
                method: "POST",
                body: JSON.stringify(data),
                headers: new Headers({
                    "Authorization": `Token ${this.apiSettings.token}`,
                    "Content-Type": "application/json",
                }),
            }
        ).then(response => {
            if (response.status >= 200 && response.status < 300) {
                console.log("Rapporterade in poäng:", score);
                if (onSuccess) onSuccess();
            }
            else {
                console.error("Oväntad respons vid poänginrapportering:", response);
                if (onFail) onFail(response);
            }
        }).catch(reason => {
            console.error("Kunde inte rapportera in poängen:", reason);
            if (onFail) onFail(reason);
        });
    }
}