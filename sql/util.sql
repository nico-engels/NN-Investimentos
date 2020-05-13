-- Para identificar as transferências
insert into grupo_lancamento
select @rownum := @rownum + 1 as rownum
     , SYSDATE() as created_at
     , SYSDATE() as updated_at
  from lancamento l
 cross join (select @rownum := 0) rn
 where 1 = 1
   and l.tipo = 200
   and l.saida > 0
   and exists (select 1 from lancamento sl where l.data = sl.data and sl.entrada = l.saida and sl.tipo = 200);

update lancamento ul
join (
  select l.id, @rownum := @rownum + 1 as rownum
    from lancamento l
   cross join (select @rownum := 0) rn
   where 1 = 1
     and l.tipo = 200
     and l.saida > 0
     and exists (select 1 from lancamento sl where l.data = sl.data and sl.entrada = l.saida and sl.tipo = 200)
) as l on ul.id = l.id
set ul.id_grupo = l.rownum;

update lancamento ul
join (
  select l.id, lt.id_grupo
    from lancamento l
   inner join lancamento lt
           on l.data = lt.data
          and l.entrada = lt.saida
          and lt.saida > 0
          and lt.tipo = 200
   where 1 = 1
     and l.tipo = 200
) as l on ul.id = l.id
set ul.id_grupo = l.id_grupo;

-- Saldo dos fiis e ações, para retirar aluguéis e dividendos
select a.id, a.nome, sum(l.entrada) - sum(l.saida) as saldo
  from aplicacao a
 inner join lancamento l
         on a.id = l.id_aplicacao
 where 1 = 1
   /*and a.nome = 'XPML11'*/
   and a.classe in (8, 9) /* fii, ação      */
   and l.tipo not in (004 /* valorização    */
                     ,101 /* desvalorização */
                     ,104 /* corretagem     */
                     ,201 /* aplicação      */
                     )
 group by a.id, a.nome
 having sum(l.entrada) - sum(l.saida) > 0;

select a.id as id_apl
     , a.nome
     , l.id as id_lcto
     , date_format(l.data, '%d/%m/%Y') as data
     , l.entrada
     , l.saida
     , sum(l.entrada) over (order by l.data) - sum(l.saida) over (order by l.data) as saldo
  from aplicacao a
 inner join lancamento l
         on a.id = l.id_aplicacao
 where 1 = 1
   and a.nome = 'XPML11'
   and a.classe in (8, 9) /* fii, ação      */
   and l.tipo not in (004 /* valorização    */
                     ,101 /* desvalorização */
                     ,104 /* corretagem     */
                     ,201 /* aplicação      */
                     )
 order by l.data;