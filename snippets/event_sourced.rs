fn handle(
    &self,
    _: &ActorContext<Self::Command>,
    incoming: Incoming<Self::Command>,
    _: &Self::State,
) -> Result<Effect<Self>, Self::Error> {
    match incoming {
        Incoming::Message(Command::Increase(reply_to)) => {
            Ok(Effect::persist(Increased).then(move |count| reply_to.reply(*count)))
        }
        _ => Ok(Effect::none()),
    }
}

fn apply(&self, count: Self::State, _: Self::Event) -> Self::State {
    count + 1
}
