{{/*
Chart name, truncated to 63 chars.
*/}}
{{- define "patient-care-ui-vue.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Fully qualified app name (release + chart), truncated to 63 chars.
*/}}
{{- define "patient-care-ui-vue.fullname" -}}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}

{{/*
Common labels.
*/}}
{{- define "patient-care-ui-vue.labels" -}}
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version | replace "+" "_" }}
{{ include "patient-care-ui-vue.selectorLabels" . }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels.
*/}}
{{- define "patient-care-ui-vue.selectorLabels" -}}
app.kubernetes.io/name: {{ include "patient-care-ui-vue.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
