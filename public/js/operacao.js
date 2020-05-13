$(document).ready(function(){

    $('#apagarSim').click(function(){

        let id = $('#id').val()
        var data = []
        data['id'] = id


        $.ajax({
            url : "/lancamentos/operacoes/apagar/" + id,
            type : 'post',
            data : data,
            success: function(res){
                bootbox.alert(res.msg, function(){
                    window.location.href = "/lancamentos/operacoes/listar"
                })
            }
        });
    })


    $('#cadastrar').click(function(){
        window.location.href = "cadastrar";
    })

    $('.voltar').click(function(){
        window.location.href = "/";
    })
})