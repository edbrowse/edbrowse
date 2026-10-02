# Each local check has its own process and temporary output files.
PROGRAM ?= ../src/edbrowse

checks = classlist.html collection.html custom.html dynamic-form.html \
	fragment.html getelem.html multiline-attribute.html mutation.html \
	performance-observer.html queryselector.html \
	script-adds-nodes.html scriptorder.html style.html \
	table.html timer.html unbalanced-attribute.html table-render
ifeq ($(strip $(LOCAL)),)
# One job runs the network checks sequentially, even under make -j.
checks += network
endif
ifneq ($(strip $(TRACE)),)
checks += trace
endif

.PHONY: test $(checks)
test: $(checks)
	@echo ok

$(checks):
	./run-test "$(PROGRAM)" "$@"
