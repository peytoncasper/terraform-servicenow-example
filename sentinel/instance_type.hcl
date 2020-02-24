import "tfplan"

get_instances = func(type) {
	instances = []

	if length(tfplan.module_paths else []) > 0 {
		# Iterate all modules
		for tfplan.module_paths as path {
			# Get all aws_instance Resources in Module
			module_instances = tfplan.module(path).resources["aws_instance"] else {}
			for module_instances as _, instance {
				# Iterate each aws_instnace and append to list
				for instance as _, body {
					append(instances, body)
				}
			}

		}
	}

	return instances
}

instance_types = [
	"m5.large",
]

instance_type_allowed = rule {
	all get_instances("aws_instance") as r {
		r.applied.instance_type in instance_types
	}
}

main = rule {
	(instance_type_allowed) else true
}