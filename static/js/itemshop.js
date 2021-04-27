document.addEventListener('DOMContentLoaded',(e)=>{
    const csrf_token = document.querySelector('[name=csrfmiddlewaretoken]').value;

    function buy_item(e){
        const gold_balance = document.getElementById('balance').innerText.split("\n\n")[1];
        const item_cost = document.getElementById(e.target.id+"Cost").innerText.split("")[0];

        if(Number(item_cost) <= Number( gold_balance )) {
            fetch('/MUD/buy_item', {
                credentials: 'same-origin',
                headers: {
                    'content-type': 'application/json; charset=utf-8',
                    'X-CSRFToken': csrf_token
                },
                method: 'post',
                body: JSON.stringify({
                    'item_name': e.target.id,
                }),
            }).then((response) => {
                if (response.status !== 200) {
                    console.error("Could not buy");
                }else{
                    console.log("Bought!")
                }
            });
    }
        else{
            console.log("can't afford");
        }
    }

    const buttons = document.querySelectorAll('.btn');
    buttons.forEach((btn)=> btn.addEventListener('click',buy_item));
});
