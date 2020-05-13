#~~~ Utilitário para definir o SO
SO=win
SO_SEPARADOR_PREF=\\

#~~~ Objetos
OBJS_COMPILAR=\
  main

OBJS_DIR=bin/
VPATH=$(OBJS_DIR)

ALVO_OBJS=$(addsuffix .o,$(OBJS_COMPILAR))
ALVO_OBJS_DIR=$(addprefix $(OBJS_DIR),$(ALVO_OBJS))

#~~~ Executável
EXE="nn-inv exp_bd.exe"

#~~~ Bibliotecas utilizadas
BIBLIO_INC=-I"C:\Users\nico\Desktop\CPP\Save\Fontes\ANSave\include"

#~~~ Configurações de compilação
COMPILADOR_PASTA_BIN=c:/msys64/mingw64/bin/
COMPILADOR_EXE=$(COMPILADOR_PASTA_BIN)g++

APAGADOR_EXE=del /Q

COMPILADOR_DIRETIVAS=-Wall -Wextra -Werror -Wno-misleading-indentation -std=c++2a -fconcepts

#~~~ BD
SGBD=MYSQL
ifeq ($(SGBD),MYSQL)
  COMPILADOR_DIRETIVAS+=-D SGBD_MYSQL
endif

#COMPILADOR_MODO=OTIMIZADO

ifeq ($(COMPILADOR_MODO),)
  COMPILADOR_DIRETIVAS+= -ggdb
else
  COMPILADOR_DIRETIVAS+= -O3 -s
endif

#~~~ Linkador
LINKER_BIBLIOTECAS=-static \
  "C:\Users\nico\Desktop\CPP\Save\Fontes\ANSave\bin\win\NES_biblio.a"\
  "C:\Users\nico\Desktop\CPP\Save\Bibliotecas Externas\64\win\lib\libmysql.lib"

#~~~ Regras
$(EXE): $(ALVO_OBJS)
	$(COMPILADOR_EXE) $(COMPILADOR_DIRETIVAS) -o $(OBJS_DIR)$(EXE) $(ALVO_OBJS_DIR) $(LINKER_BIBLIOTECAS)

%.o: src/%.cpp
	$(COMPILADOR_EXE) $(COMPILADOR_DIRETIVAS) -c -o $(OBJS_DIR)$@ $< -Iinclude $(BIBLIO_INC)

.cpp:

clean:
	$(APAGADOR_EXE) $(subst /,$(SO_SEPARADOR_PREF),$(OBJS_DIR)*)