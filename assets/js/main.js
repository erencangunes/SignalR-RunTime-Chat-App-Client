

$(document).ready(() => {

// Bağlantı talebinde bulunuyoruz
const connection = new signalR.HubConnectionBuilder()
    .withUrl("https://localhost:7005/chathub")
    // bağlantı var ama bağlantı koparsa tekrar bağlanmak için // 0 - 2 - 10 - 30 sn periyotlarında isteklerde bulunur ama biz 1 - 1 - 2 - 3 - 5 olarak değiştirdik
    .withAutomaticReconnect([1000, 1000, 2000]) //[1000, 1000, 2000, 3000, 5000]
    .build();

// Bağlantı hiç kurulmadığı durumlarda bu fonksiyon kullanılır
async function start() {
    try {
    await connection.start();
    } catch (error) {
    setTimeout(() => start(), 2000);
    }
}

start();

$(".disabled").attr("disabled", "disabled");

// Body'nin altındaki herhangi bir user classına tıklandığında gerçekleşen olay
$("body").on("click", ".users", function() {
    
    $(".users").each((index, item) => {
    item.classList.remove("active");
    });

    $(this).addClass("active");

});

// Client giriş yaptığındaki öalışan fonksiyon
$("#logIn").click(() => {

    const nickName = $("#txtNickName").val();
    connection.invoke("GetNickName", nickName).catch(error =>console.log(error));

    $(".disabled").removeAttr("disabled");

});

// Client Giriş yaptıktan sonra diğer kullanıcılara gelen bildirim fonksiyonu
connection.on("clientJoined", nickName => {

    $("#clientSituationMessages").html(`${nickName} joined`);

    $("#clientSituationMessages").fadeIn(2000, () => {
    setTimeout(() => {
        $("#clientSituationMessages").fadeOut(2000);
    }, 2000)
    });

});

// Sistemte aktif olan client listesi
connection.on("clients", clients => {

    $("#_clients").html("");
    $.each(clients, (index, item) => {
    const user = $(".users").first().clone();
    user.removeClass("active");
    user.html(item.nickName);

    $("#_clients").append(user);

    })
});

// Gönderilen mesajların gösterilmesi
connection.on("receiveMessage", (message, nickName) => {

    const _message = $(".message").clone();
    _message.removeClass("message");
    _message.find("p").html(message);
    _message.find("h5")[0].innerHTML = nickName;

    $(".messageListGroup").append(_message);

});

// Mesaj Gönderme butonu
$("#btnSend").click(() => {

    const clientName = $(".users.active").first().html();
    const message = $("#txtMessage").val();
    connection.invoke("SendMessageAsync", message, clientName);

    const _message = $(".message").clone();
    _message.removeClass("message");
    _message.find("p").html(message);
    _message.find("h5")[1].innerHTML = "You";

    $(".messageListGroup").append(_message);

});

let _groupName = "";

$("#btnSendGroup").click(() => {

    const message = $("#txtMessage").val();

    if (_groupName != "") {
    
    connection.invoke("SendMessageToGroup", _groupName, message);

    const _message = $(".message").clone();
    _message.removeClass("message");
    _message.find("p").html(message);
    _message.find("h5")[1].innerHTML = "You";

    $(".messageListGroup").append(_message);

    }

})

// Oda oluşturum Görüntüleme
$("#btnCreateRoom").click(() => {

    connection.invoke("AddGroup", $("#txtRoomName").val());
});

connection.on("groups", groups => {

    $(".rooms").html("");

    let options = `<option value="-1" selected>Rooms</option>`;
    $.each(groups, (index, item) => {
    options += `<option value="${item.groupName}">${item.groupName}</option>`
    });

    $(".rooms").append(options);

});

// Seçilen gruplara giriş yapma
$("#btnEnterSelectedRooms").click(() => {

    let groupNames = [];
    $(".rooms option:selected").map((i, e) => {
    groupNames.push(e.innerHTML);
    })

    connection.invoke("AddClientToGroup", groupNames);

});

// Seçilen groubun içindeki kişileri görüntüleme
$(".rooms").change(function () {

    let groupName = $(this).val();
    _groupName = groupName[0];
    connection.invoke("GetClientToGroup", groupName[0]);

})

})

