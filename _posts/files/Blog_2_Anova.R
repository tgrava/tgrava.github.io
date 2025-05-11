set.seed(1348) #LLN postcode because why not
marketing_data <- expand.grid(
  Brand   = factor(c("A", "B")),
  Faculty = factor(c("Arts", "Science")),
  rep     = 1:30
)

marketing_data$PreferenceScore <- with(marketing_data,
                                       5 +                                    # grand mean
                                         ifelse(Brand == "A", 0.5, -0.5) +      # Brand A vs. B effect
                                         ifelse(Faculty == "Science", 0.3, -0.3) +  # Science vs. Arts effect
                                         rnorm(nrow(marketing_data), sd = 1)    # individual variability
)

table(marketing_data$Brand, marketing_data$Faculty)
model <- aov(PreferenceScore ~ Brand * Faculty, data = marketing_data)
summary(model)
