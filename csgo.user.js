// ==UserScript==
// @name         Steam CS/CS2 Competitive Match History -> JSON
// @namespace    https://steamcommunity.com
// @match        https://steamcommunity.com/id/*/gcpd/730*
// @version      3.0
// @description  Load all CS:GO and CS2 competitive match history and export it as JSON
// @grant        none
// ==/UserScript==

(async () => {
    "use strict";

    const TABLE_SELECTOR = ".generic_kv_table.csgo_scoreboard_root";
    const CONTAINER_SELECTOR = "#personaldata_elements_container";
    const LOAD_BUTTON_SELECTOR = "#load_more_clickable";

    /*
     * The same Steam page is used for both games.
     *
     * CS:GO:
     * ?tab=matchhistorycompetitive
     *
     * CS2:
     * no tab, or the current CS2 competitive history tab.
     */
    const isCSGO =
        new URLSearchParams(window.location.search).get("tab") ===
        "matchhistorycompetitive";

    const GAME = isCSGO ? "csgo" : "cs2";

    const MAPS = {
        "Competitive Office": "cs_office",
        "Competitive Agency": "cs_agency",
        "Competitive Insertion": "cs_insertion",
        "Competitive Vertigo": "de_vertigo",
        "Competitive Dust II": "de_dust2",
        "Competitive Mirage": "de_mirage",
        "Competitive Inferno": "de_inferno",
        "Competitive Nuke": "de_nuke",
        "Competitive Austria": "de_austria",
        "Competitive Anubis": "de_anubis",
        "Competitive de_anubis": "de_anubis",
        "Competitive Cobblestone": "de_cbble",
        "Competitive Biome": "de_biome",
        "Competitive Cache": "de_cache",
        "Competitive Ruby": "de_ruby",
        "Competitive Workout": "cs_workout",
        "Competitive Zoo": "de_zoo",
        "Competitive Train": "de_train",
        "Competitive Overpass": "de_overpass",
        "Competitive Canals": "de_canals",
        "Competitive Abbey": "de_abbey",
        "Competitive Italy": "cs_italy",
        "Competitive Assault": "cs_assault",
        "Competitive Subzero": "de_subzero",
        "Competitive Breach": "de_breach",

        // Older CS:GO maps / possible naming variants.
        "Competitive Dust": "de_dust",
        "Competitive Dust II": "de_dust2",
        "Competitive Lake": "de_lake",
        "Competitive Safehouse": "de_safehouse",
        "Competitive Shortdust": "de_shortdust",
        "Competitive Bank": "de_bank",
        "Competitive St. Marc": "de_stmarc",
        "Competitive Sugarcane": "de_sugarcane",
        "Competitive Militia": "cs_militia",
        "Competitive Seaside": "de_seaside",
        "Competitive Mist": "de_mist",
        "Competitive Santorini": "de_santorini",
        "Competitive Cruise": "de_cruise",
        "Competitive Rialto": "de_rialto",
        "Competitive Austria": "de_austria",
        "Competitive Baggage": "de_baggage",
        "Competitive Blacksite": "de_blacksite",
        "Competitive Canals": "de_canals",
        "Competitive Guard": "de_guard",
        "Competitive Elysion": "de_elysion",
        "Competitive Engage": "de_engage",
        "Competitive Ancient": "de_ancient"
    };

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function cleanText(el) {
        return el?.textContent?.replace(/\s+/g, " ").trim() ?? "";
    }

    function hmsToSeconds(str) {
        if (!str) {
            return 0;
        }

        const parts = str.trim().split(":").map(Number);

        if (parts.some(Number.isNaN)) {
            return 0;
        }

        if (parts.length === 2) {
            return parts[0] * 60 + parts[1];
        }

        if (parts.length === 3) {
            return (
                parts[0] * 3600 +
                parts[1] * 60 +
                parts[2]
            );
        }

        return 0;
    }

    function getDisplayName() {
        return (
            document
                .querySelector(".persona_name_text_content")
                ?.textContent
                .trim() ||
            document
                .querySelector("#account_pulldown")
                ?.textContent
                .trim() ||
            ""
        );
    }

    function getPlayer(row) {
        const cells = row.querySelectorAll(":scope > td");

        if (cells.length < 8) {
            return null;
        }

        const name =
            cells[0]
                .querySelector("a.linkTitle")
                ?.textContent
                .trim() ||
            cleanText(cells[0]);

        const mvpText = cleanText(cells[5]);

        let mvps = 0;

        if (mvpText.includes("★")) {
            const number = mvpText.replace(/[^0-9]/g, "");

            mvps =
                number === ""
                    ? 1
                    : parseInt(number, 10);
        }

        return {
            name,

            ping:
                parseInt(cleanText(cells[1]), 10) || 0,

            kills:
                parseInt(cleanText(cells[2]), 10) || 0,

            assists:
                parseInt(cleanText(cells[3]), 10) || 0,

            deaths:
                parseInt(cleanText(cells[4]), 10) || 0,

            mvps,

            hsp:
                parseInt(
                    cleanText(cells[6]).replace("%", ""),
                    10
                ) || 0,

            score:
                parseInt(cleanText(cells[7]), 10) || 0
        };
    }

    /*
     * Don't use document.querySelector() here.
     *
     * Steam can have multiple scoreboard tables in the DOM.
     * Collect all of them.
     */
    function getMatchRows() {
        const tables = [
            ...document.querySelectorAll(TABLE_SELECTOR)
        ];

        return tables.flatMap(table =>
            [
                ...table.querySelectorAll(
                    ":scope > tbody > tr"
                )
            ].filter(row =>
                row.querySelector(
                    ".csgo_scoreboard_inner_left"
                )
            )
        );
    }

    function parseMatch(gameElement, displayName) {
        const leftTable =
            gameElement.querySelector(
                ".csgo_scoreboard_inner_left"
            );

        if (!leftTable) {
            return null;
        }

        const info =
            leftTable.querySelectorAll(
                ":scope > tbody > tr > td"
            );

        if (info.length < 4) {
            return null;
        }

        const rawMap = cleanText(info[0]);

        const rawDate = cleanText(info[1]);

        const rawWaitTime = cleanText(info[2])
            .replace(/^Wait Time:\s*/i, "");

        const rawDuration = cleanText(info[3])
            .replace(/^Match Duration:\s*/i, "");

        const rightTable =
            gameElement.querySelector(
                ".csgo_scoreboard_inner_right"
            );

        if (!rightTable) {
            return null;
        }

        const rows = [
            ...rightTable.querySelectorAll(
                ":scope > tbody > tr"
            )
        ];

        /*
         * Player rows have a Steam player link.
         */
        const playerRows = rows.filter(row =>
            row.querySelector("a.linkTitle")
        );

        /*
         * Score row.
         */
        const scoreRow = rows.find(row =>
            row.classList.contains(
                "csgo_scoreboard_score"
            ) ||
            row.querySelector(
                ".csgo_scoreboard_score"
            )
        );

        const scoreElement =
            scoreRow?.querySelector(
                ".csgo_scoreboard_score"
            ) ||
            rightTable.querySelector(
                ".csgo_scoreboard_score"
            );

        if (
            !scoreElement ||
            playerRows.length < 10
        ) {
            console.warn(
                "[CS JSON] Could not parse match:",
                gameElement
            );

            return null;
        }

        const scoreText = cleanText(scoreElement);

        const scoreParts = scoreText
            .split(":")
            .map(x => parseInt(x.trim(), 10));

        if (
            scoreParts.length !== 2 ||
            Number.isNaN(scoreParts[0]) ||
            Number.isNaN(scoreParts[1])
        ) {
            console.warn(
                "[CS JSON] Could not parse score:",
                scoreText
            );

            return null;
        }

        const topPlayers = playerRows
            .slice(0, 5)
            .map(getPlayer)
            .filter(Boolean);

        const bottomPlayers = playerRows
            .slice(5, 10)
            .map(getPlayer)
            .filter(Boolean);

        if (
            topPlayers.length !== 5 ||
            bottomPlayers.length !== 5
        ) {
            console.warn(
                "[CS JSON] Invalid player count:",
                playerRows.length
            );

            return null;
        }

        const topScore = scoreParts[0];
        const bottomScore = scoreParts[1];

        const topTeam = {
            score: topScore,

            won:
                topScore > bottomScore,

            draw:
                topScore === bottomScore,

            players: topPlayers
        };

        const bottomTeam = {
            score: bottomScore,

            won:
                bottomScore > topScore,

            draw:
                topScore === bottomScore,

            players: bottomPlayers
        };

        const playerIsOnTop =
            topPlayers.some(
                p => p.name === displayName
            );

        const playerIsOnBottom =
            bottomPlayers.some(
                p => p.name === displayName
            );

        /*
         * Normally exactly one team should contain the
         * account name.
         */
        let myTeam;

        let enemyTeam;

        if (playerIsOnTop) {
            myTeam = topTeam;
            enemyTeam = bottomTeam;
        } else if (playerIsOnBottom) {
            myTeam = bottomTeam;
            enemyTeam = topTeam;
        } else {
            console.warn(
                "[CS JSON] Could not find account in match:",
                displayName,
                gameElement
            );

            return null;
        }

        const parsedDate = new Date(rawDate);

        const date = Number.isNaN(
            parsedDate.getTime()
        )
            ? rawDate
            : parsedDate.toISOString();

        let map =
            MAPS[rawMap] ||
            rawMap.replace(
                /^Competitive\s+/i,
                ""
            );

        /*
         * Normalise a few common representations.
         */
        map = map.trim();

        return {
            game: GAME,
            mode: "competitive",

            map,

            time: date,

            waitTime:
                hmsToSeconds(rawWaitTime),

            duration:
                hmsToSeconds(rawDuration),

            myTeam,

            enemyTeam
        };
    }

    async function waitForPage() {
        for (let i = 0; i < 200; i++) {
            if (
                document.querySelector(
                    TABLE_SELECTOR
                )
            ) {
                return;
            }

            await sleep(100);
        }

        throw new Error(
            "Could not find the match history table."
        );
    }

    function isButtonVisible(button) {
        if (!button) {
            return false;
        }

        const style =
            window.getComputedStyle(button);

        return (
            style.display !== "none" &&
            style.visibility !== "hidden" &&
            style.opacity !== "0" &&
            button.offsetParent !== null
        );
    }

    /*
     * Wait until Steam actually adds match rows.
     *
     * This is deliberately much more tolerant than waiting
     * a fixed number of seconds. Historical CS:GO data can
     * require many load cycles.
     */
    async function waitForMatchCountIncrease(
        oldCount,
        timeout = 60000
    ) {
        const start = Date.now();

        return new Promise(resolve => {
            let resolved = false;

            const finish = count => {
                if (resolved) {
                    return;
                }

                resolved = true;

                observer.disconnect();

                resolve(count);
            };

            const observer =
                new MutationObserver(() => {
                    const count =
                        getMatchRows().length;

                    if (count > oldCount) {
                        finish(count);
                    }
                });

            observer.observe(
                document.querySelector(
                    CONTAINER_SELECTOR
                ) || document.body,
                {
                    childList: true,
                    subtree: true
                }
            );

            const timer = setInterval(() => {
                const count =
                    getMatchRows().length;

                if (count > oldCount) {
                    clearInterval(timer);
                    finish(count);
                    return;
                }

                if (
                    Date.now() - start >=
                    timeout
                ) {
                    clearInterval(timer);
                    finish(count);
                }
            }, 250);
        });
    }

    async function waitForButton(
        timeout = 15000
    ) {
        const start = Date.now();

        while (
            Date.now() - start <
            timeout
        ) {
            const button =
                document.querySelector(
                    LOAD_BUTTON_SELECTOR
                );

            if (isButtonVisible(button)) {
                return button;
            }

            await sleep(250);
        }

        return null;
    }

    async function loadAllMatches() {
        const container =
            document.querySelector(
                CONTAINER_SELECTOR
            );

        if (!container) {
            throw new Error(
                "Could not find #personaldata_elements_container."
            );
        }

        let totalLoaded =
            getMatchRows().length;

        let noProgressCount = 0;

        console.log(
            `[CS JSON] Starting ${GAME.toUpperCase()} history loader.`
        );

        console.log(
            `[CS JSON] Initial matches: ${totalLoaded}`
        );

        while (true) {
            /*
             * Steam can temporarily remove the button while
             * the previous request is completing.
             */
            let button =
                await waitForButton(15000);

            if (!button) {
                const count =
                    getMatchRows().length;

                if (count > totalLoaded) {
                    totalLoaded = count;
                    noProgressCount = 0;
                    continue;
                }

                /*
                 * Give Steam several more chances.
                 */
                let recovered = false;

                for (let i = 0; i < 5; i++) {
                    await sleep(2000);

                    button =
                        document.querySelector(
                            LOAD_BUTTON_SELECTOR
                        );

                    const newCount =
                        getMatchRows().length;

                    if (
                        newCount > totalLoaded ||
                        isButtonVisible(button)
                    ) {
                        totalLoaded = newCount;
                        recovered = true;
                        break;
                    }
                }

                if (recovered) {
                    continue;
                }

                console.log(
                    `[CS JSON] Load button unavailable. ` +
                    `Final loaded count: ${getMatchRows().length}`
                );

                break;
            }

            const before =
                getMatchRows().length;

            console.log(
                `[CS JSON] ${before} matches loaded. Loading more...`
            );

            /*
             * Scroll directly to the button.
             *
             * This is important for the old CS:GO page where
             * there can be a very large amount of empty page
             * space before the first historical matches.
             */
            button.scrollIntoView({
                behavior: "auto",
                block: "center"
            });

            await sleep(300);

            /*
             * Steam can replace the button during scrolling.
             * Always obtain the current element.
             */
            button =
                document.querySelector(
                    LOAD_BUTTON_SELECTOR
                );

            if (!isButtonVisible(button)) {
                continue;
            }

            /*
             * Click Steam's own loader.
             */
            button.click();

            /*
             * Wait for the DOM to actually grow.
             *
             * Timeout is deliberately 60 seconds because old
             * Steam history requests can be slow.
             */
            const after =
                await waitForMatchCountIncrease(
                    before,
                    60000
                );

            console.log(
                `[CS JSON] Loaded ${after} matches.`
            );

            if (after > before) {
                totalLoaded = after;
                noProgressCount = 0;

                /*
                 * Let Steam finish creating/replacing the
                 * next button.
                 */
                await sleep(750);

                continue;
            }

            /*
             * No new rows appeared.
             *
             * Don't immediately assume this is the end.
             */
            noProgressCount++;

            console.warn(
                `[CS JSON] No new matches loaded ` +
                `(${noProgressCount}/5).`
            );

            if (noProgressCount < 5) {
                await sleep(3000);
                continue;
            }

            /*
             * One final check.
             */
            const finalButton =
                document.querySelector(
                    LOAD_BUTTON_SELECTOR
                );

            const finalCount =
                getMatchRows().length;

            if (
                finalCount > totalLoaded ||
                isButtonVisible(finalButton)
            ) {
                totalLoaded = finalCount;
                noProgressCount = 0;
                continue;
            }

            break;
        }

        await sleep(2000);

        const finalRows =
            getMatchRows();

        console.log(
            `[CS JSON] Finished loading ${GAME.toUpperCase()} history.`
        );

        console.log(
            `[CS JSON] Total match rows: ${finalRows.length}`
        );

        return finalRows;
    }

    function createMatchKey(match) {
        return JSON.stringify([
            match.game,
            match.mode,
            match.time,
            match.map,

            match.myTeam.score,
            match.enemyTeam.score,

            match.myTeam.players.map(
                p => p.name
            ),

            match.enemyTeam.players.map(
                p => p.name
            )
        ]);
    }

    function deduplicateMatches(matches) {
        const seen = new Set();
        const unique = [];

        for (const match of matches) {
            const key =
                createMatchKey(match);

            if (seen.has(key)) {
                continue;
            }

            seen.add(key);
            unique.push(match);
        }

        return unique;
    }

    function sortMatches(matches) {
        return [...matches].sort(
            (a, b) => {
                const aTime =
                    new Date(a.time).getTime();

                const bTime =
                    new Date(b.time).getTime();

                if (
                    Number.isNaN(aTime) ||
                    Number.isNaN(bTime)
                ) {
                    return 0;
                }

                return aTime - bTime;
            }
        );
    }

    function downloadJSON(matches) {
        const json =
            JSON.stringify(
                matches,
                null,
                2
            );

        const blob =
            new Blob(
                [json],
                {
                    type:
                        "application/json;charset=utf-8"
                }
            );

        const url =
            URL.createObjectURL(blob);

        const anchor =
            document.createElement("a");

        anchor.href = url;

        anchor.download =
            `${GAME}_competitive_matches.json`;

        document.body.appendChild(anchor);

        anchor.click();

        anchor.remove();

        setTimeout(
            () =>
                URL.revokeObjectURL(url),
            1000
        );
    }

    function showStatus(message) {
        console.log(
            `[CS JSON] ${message}`
        );

        let status =
            document.getElementById(
                "cs-json-status"
            );

        if (!status) {
            status =
                document.createElement("div");

            status.id =
                "cs-json-status";

            Object.assign(
                status.style,
                {
                    position: "fixed",
                    right: "20px",
                    bottom: "20px",
                    zIndex: "999999",
                    background: "#171d25",
                    color: "#d6d7d8",
                    padding: "12px 16px",
                    borderRadius: "4px",
                    fontFamily:
                        "Arial, sans-serif",
                    fontSize: "14px",
                    maxWidth: "500px",
                    boxShadow:
                        "0 2px 10px rgba(0,0,0,.5)"
                }
            );

            document.body.appendChild(
                status
            );
        }

        status.textContent =
            message;
    }

    async function main() {
        await waitForPage();

        const displayName =
            getDisplayName();

        if (!displayName) {
            throw new Error(
                "Could not determine Steam display name."
            );
        }

        showStatus(
            `Loading all ${
                GAME === "csgo"
                    ? "CS:GO"
                    : "CS2"
            } competitive matches...`
        );

        const games =
            await loadAllMatches();

        showStatus(
            `Parsing ${games.length} ${
                GAME === "csgo"
                    ? "CS:GO"
                    : "CS2"
            } matches...`
        );

        const matches = [];

        for (const game of games) {
            const match =
                parseMatch(
                    game,
                    displayName
                );

            if (match) {
                matches.push(match);
            }
        }

        const unique =
            deduplicateMatches(
                matches
            );

        const sorted =
            sortMatches(unique);

        console.log(
            `[CS JSON] Parsed ${matches.length} matches.`
        );

        console.log(
            `[CS JSON] After deduplication: ${sorted.length} matches.`
        );

        downloadJSON(sorted);

        showStatus(
            `Done: exported ${sorted.length} ${
                GAME === "csgo"
                    ? "CS:GO"
                    : "CS2"
            } matches.`
        );

        console.log(
            "[CS JSON] Export complete:",
            sorted
        );
    }

    try {
        await main();
    } catch (error) {
        console.error(
            "[CS JSON] Error:",
            error
        );

        showStatus(
            `Error: ${
                error instanceof Error
                    ? error.message
                    : String(error)
            }`
        );
    }
})();
